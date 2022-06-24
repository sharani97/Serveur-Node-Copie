from typing import Dict, List
from tasks import EmailSender, MissionReport, NotifSender, S3Sender
from dataclass import Mission, User, Reward, Order, Vote, Idea, Notif
# from . import notifs
from loc import _
import statistics
import arrow

from bson.objectid import ObjectId
from gcore import mongoapi, users, const
logger = None


def set_logger(_logger):
    global logger
    logger = _logger


phases = ['phase1', 'phase2', 'phase3']


def weekly_notif(data, db, config):

    warned_users = []
    phase_seq = [3, 2, 1]
    if 'payload' in data and 'phases' in data['payload']:
        phase_seq = data['payload']['phases']
    else:
        day = str(arrow.now().format('d'))
        if day == '1' or day == '2':  # monday or tuesday, normally
            phase_seq = [2, 1, 3]
        if day == '3' or day == '3':  # wed or thu
            phase_seq = [1, 3, 2]

    active_missions = db.missions.find({
        '$or': [
            {'phase1.state': 'ready'},
            {'phase2.state': 'ready'},
            {'phase3.state': 'ready'}
        ]
    })

    missionDict = {}
    phases = [
        [],
        [],
        [],
        []
    ]

    for mission_obj in active_missions:
        mission = Mission(mission_obj)
        if mission.isActive:
            missionDict[mission._id] = mission
            nb = mission.currentPhase.nb
            phases[nb].append(mission._id)

    # do phase 3 notifs
    for phase in phase_seq:

        for mission_id in phases[phase]:

            mission: Mission = missionDict[mission_id]
            uri = 'missions/{}'.format(mission._id)

            users = User.gets(mission.members)
            nb_actions_available = 0

            total_actions_done = 0
            actions = []
            active_actors = []
            user_action_nb: Dict[str, List] = {}
            ntypes = None
            threshold = 0

            nb_accepted = len(mission.accepted)
            if nb_accepted > 1:
                for user in users:
                    if user._id not in mission.accepted:
                        ntype = const.NOTIF_MISSION_LOCKED_CALLING
                        locdata = {
                            'mission': mission.title,
                            'actors': nb_accepted
                        }
                        _, _, message = NotifSender.get_loc(ntype, locdata)
                        payload = NotifSender.blank_push_payload(
                            ntype, 'missions', mission._id, uri)
                        Notif.create(mission.creator_id, ntype, message,
                                     user._id, mission._id, uri, payload)
                        NotifSender.send_notif_type(
                            user, ntype, payload, locdata, 'notifs')
                        warned_users.append(user._id)

            if phase == 1:
                ntypes = [const.NOTIF_MISSION1_CALLING,
                          const.NOTIF_MISSION1_THANKYOU]
                nb_actions_available = 1  # allows us to say : you haven't taken part yet
                ideas = Mission.get_ideas_CURSOR(mission_id)

                for obj in ideas:
                    action = Idea(obj)
                    actions.append(action)
                    user_id = action.creator_id
                    total_actions_done += 1

                    if user_id not in user_action_nb:
                        user_action_nb[user_id] = 0
                        active_actors.append(user_id)

                    user_action_nb[user_id] += 1

            if phase == 2:
                ntypes = [const.NOTIF_MISSION2_CALLING,
                          const.NOTIF_MISSION2_THANKYOU]
                nb_actions_available = Mission.count_ideas(mission_id)
                votes = Mission.get_votes_CURSOR(mission_id)

                for obj in votes:
                    action = Vote(obj)
                    actions.append(action)
                    user_id = action.voter_id
                    total_actions_done += 1

                    if user_id not in user_action_nb:
                        user_action_nb[user_id] = 0
                        active_actors.append(user_id)

                    user_action_nb[user_id] += 1

            if phase == 3:
                ntypes = [const.NOTIF_MISSION3_CALLING,
                          const.NOTIF_MISSION3_THANKYOU]
                threshold = 100

                nb_actions_available = mission.start_credits
                if nb_actions_available == -1:
                    raise Exception(
                        "Phase 3 Mission should have start credits set")

                orders = Mission.get_orders_CURSOR(mission_id)

                for obj in orders:
                    action = Order(obj)
                    actions.append(action)
                    user_id = action.buyer_id
                    total_actions_done += 1

                    if user_id not in user_action_nb:
                        user_action_nb[user_id] = 0
                        active_actors.append(user_id)

                    user_action_nb[user_id] += action.buy_nb

            for user in users:
                # only send one at a time
                if user._id not in warned_users:

                    # how many actions already made ? nb_actions_available
                    # how many actions does the player have left ?

                    user_actions = 0
                    if user._id in user_action_nb:
                        user_actions = user_action_nb[user._id]

                    available_actions = nb_actions_available - user_actions

                    locdata = {
                        'actors': len(active_actors),
                        'available': available_actions,
                        'mission': mission.title,
                        'actions': total_actions_done
                    }

                    if available_actions > threshold:
                        ntype = ntypes[0]
                    else:
                        ntype = ntypes[1]

                    _, _, message = NotifSender.get_loc(ntype, locdata)

                    payload = NotifSender.blank_push_payload(
                        ntype, 'missions', mission._id, uri)
                    Notif.create(mission.creator_id, ntype, message, user._id,
                                 mission._id, uri, payload, available_actions)
                    NotifSender.send_notif_type(
                        user, ntype, payload, locdata, 'notifs')
                    warned_users.append(user._id)

    return True, {}


def generate_and_send_report(db, conf, mission, payload, email_type='end_of_mission_report', force_generate=False):

    reporter = MissionReport(mission["_id"], mission)

    filedata = reporter.run(None, force_generate)
    if filedata is None:
        raise Exception("No file data returned")

    filename = reporter.filename

    # 2. send the email to the org admins
    _mission = reporter.mission

    if _mission.org:
        org = db.organizations.find_one({"_id": _mission.org})
        orgadmins = db.users.find(({"_id": {'$in': org["admins"]}}))
        emails = []
        for _user in orgadmins:
            user = User(_user)
            if user.email not in emails:  # and user.validated:
                emails.append(user.email)

        if len(emails) > 0:

            if email_type == const.EMAIL_MID_MISSION_REPORT:
                EmailSender.mid_mission_report(emails, mission, filename)
            if email_type == const.EMAIL_END_OF_MISSION_REPORT:
                EmailSender.end_of_mission_report(emails, mission, filename)
        else:
            print("no orgadmins in org ??")

    # print(filedata)
    #print(filedata.filename, filedata.bucket, filedata.key)

    S3Sender.upload_file(filedata)
    return reporter


def warn_mission_in_progress(data, db, config):

    payload = data['payload']

    mission_id = data["payload"]["mission_id"]
    # get mission ? for example start date / type ?
    _mission = db.missions.find_one({'_id': mission_id})
    if _mission is None:
        return True, {}

    mission = Mission(_mission)
    if mission.time_left == 0:
        return True, {}

    count = 1
    phaseNb = 0

    for phase in mission.phases:
        if phase.isReady:
            current_phase = phase
            phaseNb = count
        count += 1

    activePhase = "phase{}".format(phaseNb)
    # get all users

    # let's just run the mission report and be done with it. We can even send it to the orgadmins.
    reporter = generate_and_send_report(
        db, config, _mission, payload, const.EMAIL_MID_MISSION_REPORT)
    # ideaCount = len(reporter.ideaDict.keys())
    mission = reporter.mission

    emails = []
    for user in reporter.userDict:
        emails.append(reporter.userDict[user].email)

    EmailSender.mid_mission_reminder(emails, mission.title, mission.time_left)

    return True, {}
    # if current_phase == 1


def warn_mission_locked(data, db, config):

    mission_id = data["payload"]["mission_id"]
    # members = data["payload"]["members"]
    # mission_title = data["payload"]["title"]
    from_id = data["payload"]["from"]

    inviter_user = User(db.users.find_one({'_id': ObjectId(from_id)}))

    _mission = db.missions.find_one({'_id': mission_id})
    if _mission is None:
        return True, {}

    mission = Mission(_mission)
    members = mission.members

    emails = []
    users = []

    USR_CURSOR = db.users.find({'_id': {'$in': members}})

    for _user in USR_CURSOR:
        if _user["email"] not in emails:
            emails.append(_user["email"])
        users.append(User(_user))

    notifs = NotifSender()
    notifs.mission_locked(users, mission, inviter_user)

    if len(emails) > 0:
        EmailSender.mission_locked(emails, mission.title, inviter_user.anoname)

    return True, {}


def get_phase(mission):
    """
      Returns the current mission phase state, as text
    """

    # 1 ready
    # 1 active
    # 1 finished
    # 1 closed ?

    now = arrow.utcnow().naive

    for phase in phases:

        phase_data = mission[phase]
        if now < phase_data["start"]:
            return "pre {}".format(phase)

        if now > phase_data["start"] and now < phase_data["end"]:
            return phase

        if now > phase_data["end"] and ("state" not in phase_data or phase_data["state"] != "finished"):
            return "{} over, requires action".format(phase)

    return "over"


# this I can unit test
def run_phase2_stats(ideas, db, conf):
    """
    Calculates the phase2 type stats, i.e. nb of votes
    Only works while the phase is active
    """

    # as mission report has been run we already hae what we need
    idea_dict_data = {}

    for idea in ideas:

        votes = len(idea.votes)
        if votes == 0:
            votes = 1

        idea_data = {
            'avg': idea.vote_total/votes,
            'total': idea.vote_total,
            'nb': len(idea.votes)
        }
        for v in idea.vote_data:
            idea_data[v] = idea.vote_data[v]

        str_id = str(idea._id)
        idea_dict_data[str_id] = idea_data
        db.ideas.update({'_id': idea._id}, {
                        '$set': {'data.phase2': idea_data}}, upsert=False)

    return idea_dict_data


# this I can unit test
def run_phase3_stats(ideas, db, conf, mission):

    nb_users = len(mission.accepted)
    start_credit = mission.start_credits
    total_capital = nb_users * start_credit

    idea_dict_data = {}

    mission_total = 0

    for idea in ideas:

        buy_amounts = []
        for order in idea.orders:
            buy_amounts.append(order['buy_nb'])

        mission_total += idea.credits

        # some stats

        investors = len(idea.investors)

        if investors == 0:
            investors = 1

        idea_data = {
            'order_amounts': {
                'mean': 0,
                'median': 0,
                'std_dev': 0
            },
            'total': idea.credits,
            'nb_buyers': len(idea.investors),
            'average_buy': idea.credits/investors,
            'price': idea['price'],
            'pct': idea.credits/total_capital,
        }

        if len(buy_amounts) > 0:

            idea_data['order_amounts'] = {
                'mean': statistics.mean(buy_amounts),
                'median': statistics.median(buy_amounts),
                'std_dev': statistics.pstdev(buy_amounts)
            }

        idea_dict_data[str(idea._id)] = idea_data

    for idea in ideas:
        idea_data = idea_dict_data[str(idea._id)]
        idea_data['popularity'] = idea_data['total']/mission_total
        db.ideas.update({'_id': idea._id}, {
                        '$set': {'data.phase3': idea_data}}, upsert=False)

    return idea_dict_data,


def check_mission_phase_end(job, db, conf):

    rewards = conf["rewards"]
    payload = job["payload"]

    # state: ['wip', 'locked','finished', 'closed', 'cancelled']

    _id = ObjectId(payload['mission_id'])

    mission_obj = db.missions.find_one({'_id': _id})
    if mission_obj is None:
        return False, {}

    mission = Mission(mission_obj)

    start_credits = mission_obj['start_credits']
    mission_creator = str(mission_obj['creator_id'])
    no_phase_1 = (mission_obj['phase1']['active'] == False)

    if mission_obj['state'] == 'wip':
        _new_job = mongoapi.make_job('warn.mission_still_wip', payload)
        return True, _new_job

    #  ['wip', 'locked','finished', 'closed', 'cancelled']
    if mission_obj['state'] in ['closed', 'cancelled']:
        # already done / useless
        print('mission closed or cancelled, skipping')
        return True, {}

    phase_nb = mission.currentPhase.nb
    phase_data = mission.currentPhase.data

    now = arrow.utcnow().naive

    if now < phase_data["end"]:
        #print("before phase {} end, check at a later date".format(phase_nb))
        _new_job = mongoapi.make_job(const.JOB_MISSION_CHECK_PHASE_END,
                                     payload, mongoapi.tool_user['_id'], "new", phase_data["end"])
        return True, _new_job

    # i.e. now > phase_data["end"]
    if phase_data['state'] in ["finished", "closed"]:
        return True, {}

    # the previous mission phase has not been properly managed ?
    if phase_data['state'] == "pending":
        _new_job = mongoapi.make_job(
            'warn.mission_phase_still_pending', payload, mongoapi.tool_user['_id'], "new")
        return True, _new_job

    # we've checked everything (we hope) so let's get to it.

    # 1. start by generating the report
    reporter = generate_and_send_report(
        db, conf, mission_obj, payload, const.EMAIL_END_OF_MISSION_REPORT, True)
    _mission = reporter.mission

    Notif.clearOldNotifs(_mission._id, "missions")

    mission_type = _("phases.phase{}".format(phase_nb), "mission")

    locdata = {
        "mission_title": _mission.title,
        "mission_type": mission_type
    }

    # sort_criterion
    criteria = {
        "phase1": "like_score",
        "phase2": "vote_total",
        "phase3": "credits"
    }

    # sort ideas by cc
    criterion = criteria["phase{}".format(phase_nb)]

    ideas = []

    for id in reporter.ideaDict:
        ideas.append(reporter.ideaDict[id])

    ideas.sort(key=lambda idea: getattr(idea, criterion), reverse=True)
    nb_ideas = len(ideas)

    ranks = {
        "top5pct": round(nb_ideas*0.05),
        "top20pct": round(nb_ideas*0.2)
    }

    if len(ideas) > 3:
        # reward top idea
        reward = Reward("phase{}_top".format(phase_nb), conf)
        first_index = 0
        if first_index not in ideas:
            first_index = 1

        topIdea = ideas[first_index]
        creator = topIdea.author

        users.reward_user(db, creator._id, reward, _mission.org, _mission._id)
        creator.reward(reward, True)

        # reward 5 percenters
        if ranks['top5pct'] > first_index:
            for i in range(first_index, ranks['top5pct']):
                idea = ideas[i]
                creator = idea.author
                reward = Reward("phase{}_top5pct".format(phase_nb), conf)
                users.reward_user(db, creator._id, reward,
                                  _mission.org, _mission._id)
                creator.reward(reward, True)

        # reward 20 percenters
        if ranks['top20pct'] > ranks['top5pct']:
            for i in range(ranks['top5pct'], ranks['top20pct']):
                idea = ideas[i]
                creator = idea.author
                reward = Reward("phase{}_top20pct".format(phase_nb), conf)
                users.reward_user(db, creator._id, reward,
                                  _mission.org, _mission._id)
                creator.reward(reward, True)

    # brainstorm : nothing to do
    if phase_nb == 1:
        # ideas are rewarded at creation,
        # so no need to (save) reward again for creation
        # but we do need to inform / sum up for the players

        for user_id in _mission.accepted:

            user = reporter.userDict[user_id]

            nb_ideas = user.nb_ideas
            nb_likes = user.nb_likes
            nb_comments = user.nb_comments

            idea_reward = Reward("idea", conf)
            idea_reward.scale(nb_ideas)

            like_idea_reward = Reward("like_idea", conf)
            like_idea_reward.scale(nb_likes)

            comment_idea_reward = Reward("comment_idea", conf)
            comment_idea_reward.scale(nb_comments)

            user.reward(idea_reward)
            user.reward(like_idea_reward)
            user.reward(comment_idea_reward)

    if phase_nb == 2:

        # ideas are rewarded during vote, so no need to reward again
        # however we do need to clean the base and store the results in the idea
        # NOT quite in that order :D
        for user_id in _mission.accepted:

            user = reporter.userDict[user_id]

            nb_votes = user.nb_votes
            vote_reward = Reward("vote", conf)
            vote_reward.scale(nb_votes)
            user.reward(vote_reward)

        idea_ids = []
        for idea in ideas:
            idea_ids.append(idea._id)

        run_phase2_stats(ideas, db, conf)

        # remove all votes
        db.votes.delete_many({'target_id': {'$in': idea_ids}})

    # this is where the work is done :D
    if phase_nb == 3:

        idea_ids = []

        for idea in ideas:
            idea_ids.append(idea['_id'])

        # analyse orders
        data = run_phase3_stats(ideas, db, conf, _mission)
        stats = data

        for member in _mission.accepted:  # not gonna reward those who didn't take part

            user = reporter.getUser(member)
            user_id = str(member)

            nb = user.nb_suggestions
            reward = Reward("idea_suggestion", conf)
            reward.scale(nb)
            user.reward(reward)

            nb2 = user.nb_suggestion_likes
            reward2 = Reward("like_idea_suggestion", conf)
            reward.scale(nb2)
            user.reward(reward2)

            profit_reward = Reward('profits', conf)
            activity_reward = Reward('phase3_activity', conf)

            profit_reward.scale(user.profit/start_credits)
            activity_reward.scale(user.investment/start_credits)

            users.reward_user(db, member, profit_reward,
                              _mission.org, _mission._id)
            users.reward_user(db, member, activity_reward,
                              _mission.org, _mission._id)

            user.reward(profit_reward, True)
            user.reward(activity_reward, True)

            # actually, going to group this at the end, no ?

            '''
            payload = {
                "user":str(member), 
                "rewards":[
                    {'type':'ap', 'nb':user_profit_reward.ap + user_activity_reward.ap},
                    {'type':'ip', 'nb':user_profit_reward.ip + user_activity_reward.ip},
                    {'type':'kp', 'nb':user_profit_reward.kp + user_activity_reward.kp}
                ],
                "mission":str(mission['_id']),
                "phase":3
            }

            # warn the user 
            mongoapi.save_job(db, "warn.phase3_investment_points", payload)
            '''

        # clean orders
        db.orders.delete_many({'currency': _mission._id})

    # send out user emails & notifs with template
    user_list = []
    for user_id in reporter.userDict:
        _user = reporter.userDict[user_id]
        if _user.accepted:
            NotifSender.mission_finished(_user, _mission)
            user_list.append(_user)

    EmailSender.mission_finished(user_list, _mission)

    # mark mission as finished
    mongoapi.update_object(
        db, 'missions', {"phase{}.state".format(phase_nb): "finished"}, _id)
    # warn orgadmin(s)
    #print("warn ogadmin job")
    # print(payload)
    #_new_job = mongoapi.make_job('warn.mission_phase_finished', payload, mongoapi.tool_user['_id'], "new")

    return True, {}


tasks = {
    const.JOB_MISSION_CHECK_PHASE_END: check_mission_phase_end,
    const.JOB_MISSION_LOCKED: warn_mission_locked,
    const.JOB_MISSION_IN_PROGRESS: warn_mission_in_progress,
    const.JOB_CRON_WEEKLY_NOTFS: weekly_notif

    # 'warn.mission_phase_finished'
}
