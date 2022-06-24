import xlsxwriter
import arrow
from xlsxwriter.utility import xl_rowcol_to_cell

from gcore import mongoapi

from bson.objectid import ObjectId
from loc import _

from dataclass import Mission, Idea, Order, Suggestion, User, File
from .report_styles import ReportStyles

# from .s3 import S3Sender

config = None
db = None
logger = None

def setup(_config, _db, _logger):
    global config, db, logger
    config = _config
    db = _db
    logger = _logger


topdarkblue = "#10456F"
primary = "#2196F3"

phases = ['phase1','phase2','phase3']

DEFAULT_FMT = "DD/MM/YYYY"

ROLES = ["creators", "likers", "commentators", "voters", "investors", "suggestors"]

actions = {
    "creators":"ideas",
    "likers":"likes",
    "commentators":"comments",
    "voters":"votes",
    "investors":"orders",
    "suggestors":"suggestions"
}

TYPES = []
role_dict = {}



for role in ROLES:
    TYPES.append(actions[role])
    role_dict[actions[role]] = role

def getCreatedDate(obj):
    return arrow.get(obj["created"]).format(DEFAULT_FMT)

class MissionReport():

    def __init__(self, mission_id, missionObj = None):
        """
            Create a mission report generating machine
            :param DB: a pymongo object

        """

        self.userDict = {}
        self.priceDict = {}
        self.ideaDict = {}  # these are all mission specific
        self.objDict = {}
        self.workbook = None
        self.filename = ""

        self.mission_id = mission_id

        _mission = missionObj

        if _mission is None:
            _mission = db.missions.find_one({ "_id":ObjectId(mission_id)})

        if _mission is None:
            raise ValueError('no_such_mission')
        else:
            pass

        self.mission = Mission(_mission)

        # we'll just pre-parse the members since we're going to do it anyway...
        for user_id in self.mission.accepted:
            usr = self.getUser(user_id)
            usr.accepted = True

        self.styles = ReportStyles()

    def sortWorkbook(self, workbook):

        scores = {}

        def setScore(item, value, args={}):
            key = _("sheetnames.{}".format(item), "reports", args)[:4]
            scores[key] = value

        '''
        "dash":"Synthèse",
        "activity":"Activité",
        "details":"Résultats",
        "historical":"Historique",
        "idea":"Idea{idea_nb}",
        "users":"Participants",
        "suggestions":"Résultats Améliorations",
        "suggestion":"Amélioration{nb}"
        '''


        setScore('dash', 1)
        setScore('activity', 2)
        setScore('details', 3)
        setScore('historical', 20)
        setScore('idea', 6, {'idea_nb':1})
        setScore('users', 4)
        setScore('suggestions', 5)
        setScore('suggestion', 7, {'nb':1})


        workbook.worksheets_objs.sort(key=lambda x: scores[x.name[:4]])


    def addTable(self, worksheet, headers, datalist, row=1, col=1, lastIsLink =False):


        # format headers

        for _col in range(col, col + len(headers)):
            # pylint: disable=no-member
            worksheet.write(row, _col, 'x', self.styles.table_header )

        options = {
            'data': datalist,
            'style': 'Table Style Medium 2',
            'banded_rows':True,
            'columns': headers,
            'banded_rows': 1
        }

        # Add a table to the worksheet.
        if len(datalist)> 0:
            #full_data.add_table(
            #    "{}:{}".format(xl_rowcol_to_cell(row=1, col=1), xl_rowcol_to_cell(row=1+len(ideas),col=1+len(cols))),
            #    options)
            worksheet.add_table(
                first_row=row, first_col=col,
                last_row=row + len(datalist), ## -1 + 1 for headers
                last_col= col + len(headers)-1,
                options= options)

        if lastIsLink:

            lst = len(headers)-1

            for _line in range(len(datalist)):

                if len(datalist[_line][lst]) > 1:
                    # pylint: disable=no-member
                    worksheet.write(row + 1 + _line, col + len(headers)-1, "lien", self.styles.linkStyle)

    '''
        creator_id: mongoose.Schema.Types.ObjectId,
        ext: String, // extension, 3 letters
        filetype:{
            type:String,
            enum:['image'],
        },
        url: String, //client side view  :/ => needs calculating ? + key

        // add data for GED
        key:String,         // encryption key
        date:String,        // as YYYYMMDD
        bucket:String,      // id or name ?
        target_id:mongoose.Schema.Types.ObjectId,
        target_type:{
            type:String,
            enum:['contract', 'report', 'cover'],
        }
    '''
    def checkFileData(self):

        # is mission active
        # if it is active, find today's report


        report = None
        if self.mission.isActive:
            #print("mission is active so searching for today's files")
            report = db.files.find_one({
                "filetype":'report',
                'date':arrow.now().format("YYYYMMDD"),
                'target_id':self.mission._id,
            })
        # if it is not active, find latest report
        else:
            report = db.files.find_one({
                "filetype":'report',
                'target_id':self.mission._id,
            }, sort=[("date", -1)])
        return report

    def makeFileData(self):
        return File.create(self.filename, 'xlsx',self.mission._id, 'mission','local')

    def makeHeaders(self, items, cat='headers'):


        #hum

        def makeHeader(item):
            title = _("{}.{}".format(cat, item),"reports")
            style = self.styles.headerStyle(item)
            ret = {"header": title}
            if style is not None:
                ret['format'] = style
            return ret

        ret = list(map(makeHeader, items))
        return ret


    def getUser(self, _id):
        if _id not in self.userDict:
            usr_obj = db.users.find_one({ "_id":_id})
            user = User(usr_obj)
            self.userDict[_id] = user
            return user
        else:
            return self.userDict[_id]

    def makeCommentsSheet(self, com_sheet_name, obj):
        # pylint: disable=no-member
        workbook = self.workbook
        com_sheet = workbook.add_worksheet(com_sheet_name)
        com_sheet.set_column('A:A', 5, self.styles.white)
        com_sheet.set_column('B:ZZ', 40, self.styles.white)

        com_line = 0

        com_sheet.write(com_line,1, "Titre", self.styles.activity_title)
        com_sheet.write(com_line,2, obj["title"], self.styles.activity_text)
        com_line += 1

        if obj.hasDescription:
            com_sheet.write(com_line,1, "Detail", self.styles.activity_title)
            com_sheet.write(com_line,2, obj["description"], self.styles.activity_text)
            com_line +=  1

        creator_id = obj["creator_id"]
        usr = self.getUser(creator_id)

        com_sheet.write(com_line,1, "Createur", self.styles.activity_title)
        com_sheet.write(com_line,2, usr.fullname, self.styles.activity_text)
        com_line += 1

        previous = None
        col = 1

        for comment in obj.comments:

            commentator = comment["creator_id"]

            if previous is not None and commentator != previous:
                com = self.getUser(previous)
                com_sheet.write(com_line, col, com.email, self.styles.comment_author)
                com_line += 1

            col = 2
            if commentator == creator_id:
                col = 1
            com_sheet.write(com_line, col, comment["title"], self.styles.comment_text)
            com_line += 1
            previous = commentator

        if previous in self.userDict:
            com = self.userDict[previous]
        else:
            com = db.users.find_one({ "_id":previous})
            self.userDict[previous] = com

        com_sheet.write(com_line, col, com.email, self.styles.comment_author)

        link = 'internal:{}!A1'.format(com_sheet_name)
        return link

    def setupSheet(self, _sheet, defaultSize = 20, overrides = []):
        # pylint: disable=no-member
        _sheet.set_column('A:A', 5, self.styles.white)
        if len(overrides) == 0:
            _sheet.set_column('B:ZZ', defaultSize, self.styles.wrap)
        else:
            for data in overrides:
                _size = defaultSize
                if len(data) > 1:
                    _size = data[1]
                _sheet.set_column(data[0], _size, self.styles.wrap)

    def run(self, _phase=None, force_generate=False):

        if force_generate == False:
            report =  self.checkFileData()
            if report is not None:
                self.filename = report['key']
                return File(report)

        mission_id = self.mission_id
        activePhase = None
        if _phase is None:
            for phase in phases:
                if self.mission[phase]["state"] == 'ready':
                    activePhase = phase
                    break
        else:
            activePhase = "phase{}".format(_phase)

        # setup

        # check


        filename = 'temp/missionreport_{}_{}.xlsx'.format(mission_id, arrow.now().format('YYYY-MM-DD'))
        self.filename = filename

        workbook = xlsxwriter.Workbook(filename, {'strings_to_numbers': True})
        self.workbook = workbook # lazy refactoring
        dash = workbook.add_worksheet(_("sheetnames.dash", "reports"))
        activity_name = _("sheetnames.activity", "reports")
        activity = workbook.add_worksheet(activity_name)

        full_data = workbook.add_worksheet(_("sheetnames.details", "reports"))

        suggestions = None
        if activePhase == 'phase3':
            suggestions = workbook.add_worksheet(_("sheetnames.suggestions", "reports"))

        user_sheet = workbook.add_worksheet(_("sheetnames.users", "reports"))


        historical_data_name = _("sheetnames.historical", "reports")

        historical_data = workbook.add_worksheet(historical_data_name)

        self.styles.addStyles(workbook)

        self.setupSheet(dash, 20, [['B:B'], ['C:C', 40], ['D:ZZ', 20]])

        self.setupSheet(full_data, 15, [['B:ZZ', 15]])
        self.setupSheet(historical_data, 15, [['B:ZZ', 15]])
        self.setupSheet(activity, 15, [['B:G'], ['H:H', 20], ['I:ZZ', 15]] )
        self.setupSheet(user_sheet, 15, [['B:ZZ', 15]])

        if suggestions is not None:
            self.setupSheet(suggestions, 20, [['B:B', 25], ['C:I', 15], ['J:ZZ',20]])

        # start by creating header page
        # with mission title, description, org name, creator, type, phase start and end
        _line = 1

        # pylint: disable=no-member
        dash.merge_range(_line, 1, _line, 4, "Rapport de mission", self.styles.main_title)
        _line += 1

        dash.write(_line, 1, _("items.title", "reports"), self.styles.title)
        dash.write(_line, 2, self.mission["title"], self.styles.dash_item)
        _line += 1

        dash.write(_line, 1, _("items.description", "reports"), self.styles.title)
        dash.write(_line, 2, self.mission["description"], self.styles.dash_item)

        _line += 1
        dash.write(_line, 1, _("items.type", "reports"), self.styles.title)
        dash.write(_line, 2, _("items.{}".format(activePhase),"reports"), self.styles.dash_item)
        # pylint: enable=no-member

        _line += 1

        _start = arrow.get(self.mission[activePhase]["start"])
        _end   = arrow.get(self.mission[activePhase]["end"])

        _diff = _end - _start

        length = ((_diff.total_seconds() + 1) // 3600) / 24

        current_end = _end
        now = arrow.now()

        if now > _start and now < _end:
            current_end = now

        current_length = (current_end - _start).total_seconds()/(24.0*3600)


        activity_by_day = {
            'buy_nb': 0 # the others are added below
        }

        unique_users = {
        }

        obj_count = {
            'buy_nb': 0
        }

        for typ in TYPES:
            obj_count[typ] = 0
            self.objDict[typ] = []

        for role in ROLES:
            unique_users[role] = []

        # this could be done once a day instead of on requests
        for day in range(-1, int(current_length)+2):
            date = _start.shift(days=day).format(DEFAULT_FMT)
            obj = {}
            for typ in TYPES:
                obj[typ] = 0
            for role in ROLES:
                obj[role] = []
            activity_by_day[date] = obj

        # pylint: disable=no-member
        dash.write(_line, 1, _("items.start", "reports"), self.styles.title)
        dash.write(_line, 2, _start.format("HH:MM DD/MM/YYYY"), self.styles.dash_item)

        _line += 1
        dash.write(_line, 1, _("items.end", "reports"), self.styles.title)
        dash.write(_line, 2, _end.format("HH:MM DD/MM/YYYY"), self.styles.dash_item)


        _line += 1
        dash.write(_line, 1, _("items.length", "reports"), self.styles.title)
        dash.write(_line, 2, _("items.length_in_days", "reports", {"length":length}), self.styles.dash_item)

        _line += 1
        dash.write(_line, 1, _("items.date", "reports"), self.styles.title)
        dash.write(_line, 2, arrow.now().format("HH:MM DD/MM/YYYY"), self.styles.dash_item)
        # pylint: enable=no-member

        # get mission type

        accepted_full = []
        invited_full = []

        contributors = []
        voters = []

        ideas = []
        votes = []


        accepted = []
        not_accepted = []

        if "accepted" in self.mission.data: # why should it not exist ?
            accepted_full = self.mission.accepted

        if "members" in self.mission.data:
            invited_full = self.mission.members

        for id in accepted_full:
            if id not in accepted:
                accepted.append(id)

        for id in invited_full:
            if id not in accepted and id not in not_accepted:
                not_accepted.append(id)

        total_users = len(accepted) + len(not_accepted)

        for phase in phases:
            if self.mission[phase]["state"] == 'ready':
                activePhase = phase
                break



        idea_cursor = db.ideas.find({ "mission_id":ObjectId(mission_id)})
        cnt = 0






        for obj in idea_cursor:

            idea = Idea(obj)

            self.priceDict[idea._id] = idea.price
            self.ideaDict[idea._id] = idea

            idea_date_fmt = getCreatedDate(obj)

            if idea.original_creator is not None:
                creator = idea.original_creator
            else:
                creator = idea.creator_id

            if creator not in contributors:
                contributors.append(creator)

            if idea_date_fmt in activity_by_day:
                activity_by_day[idea_date_fmt]["ideas"] += 1
                if creator not in activity_by_day[idea_date_fmt]["creators"]:
                    activity_by_day[idea_date_fmt]["creators"].append(creator)

            usr = self.getUser(creator)
            idea.setAuthor(usr)
            usr.addActivity("ideas", idea) ## ref croisées ?? gc ?

            def getActivity(atype, **kwargs):

                args            = kwargs.get('query',          {})
                creator_field   = kwargs.get('creator_field', "creator_id")
                other_units     = kwargs.get('other_units',    [])
                className       = kwargs.get('className',      None)
                callback        = kwargs.get('cb',             None)
                # name=kwargs.get('name', None)
                #firstname=kwargs.get('firstname', None)
                #args ={}, creator_field = "creator_id", other_units=[], className = None):

                query = { "target_id":idea["_id"]}
                for key in args:
                    query[key] = args[key]

                # atype = votes, likes, comments, orders...

                cursor = db[atype].find(query)
                # role = voter, liker, investor, ...
                role = role_dict[atype]

                for obj in cursor:

                    # not used (yet)
                    if className is not None:
                        obj = className(obj)
                    # not used (yet)
                    if callback is not None:
                        callback(obj)

                    obj_count[atype] += 1
                    # not used (yet)
                    for other in other_units:
                        obj_count[other] += obj[other]

                    idea.add(atype, obj)
                    date = getCreatedDate(obj)

                    _user = obj[creator_field]
                    user = self.getUser(_user)
                    user.addActivity(atype, obj)


                    if date in activity_by_day:
                        data = activity_by_day[date]

                        for other in other_units:
                            if other not in data:
                                data[other] = 0
                            data[other] += obj[other]

                        data[atype] += 1
                        if _user not in data[role]:
                            data[role].append(_user)

                    if _user not in unique_users[role]:
                        unique_users[role].append(_user)

            getActivity("likes",  query = {"meaning":"like"}, creator_field ="user_id")
            getActivity("votes",  creator_field ="voter_id")

            def update_function(order):
                order.current_price = idea.price

            getActivity("orders", creator_field ="buyer_id", other_units=["buy_nb"], className = Order, cb=update_function)

            comments_cursor = db.comments.find({"target_id":idea["_id"] })

            for obj in comments_cursor:

                date = getCreatedDate(obj)
                suggest = obj["suggest"]
                _user = obj["creator_id"]
                user = self.getUser(_user)

                idea.add_comment(obj)

                if date in activity_by_day:
                    data = activity_by_day[date]

                    if suggest:
                        if _user not in data["suggestors"]:
                            data["suggestors"].append(_user)
                        data["suggestions"] += 1
                        user.addActivity("suggestions", obj)
                        obj_count["suggestions"] += 1
                        self.objDict["suggestions"].append(obj)

                    else:
                        if _user not in data["commentators"]:
                            data["commentators"].append(_user)
                        data["comments"] += 1
                        user.addActivity("comments", obj)
                        obj_count["comments"] += 1



            link = ""

            if len(idea.comments) > 0:
                com_sheet_name = _("sheetnames.idea", "reports", {"idea_nb":cnt})
                link = self.makeCommentsSheet(com_sheet_name, idea)


            # get votes
            # get orders

            #data_line = idea.getLine(activePhase, link)


            ideas.append(idea.getLine(activePhase, link))
            cnt += 1





        # Add a table to the worksheet.
        if len(ideas)> 0:

            base_cols = ["title", "date"]
            data_by_type = {
                "phase1":["like_up", "like_down"],
                "phase2":["average", "votes"],
                "phase3":["credits", "nb_buyers", "suggestions"]
            }

            final_cols = ["comments","author","email", "discussion"]
            cols = base_cols+ data_by_type[activePhase] + final_cols

            headers = self.makeHeaders(cols, 'headers')
            self.addTable(full_data, headers, ideas, 1,1, True)



        # Add historical table to worksheet
        #

        historical_activity = []
        current = {}

        for role in ROLES:
            current[role] = []

        cols = ['date']
        # pylint: disable=no-member

        for role in ROLES:
            cols += [role, "new_{}".format(role), actions[role]]

        cols.append('credits')
        full_data_cols = self.makeHeaders(cols)

        # pylint: enable=no-member
        for day in range(0, int(current_length)+2): # 1 for rounding and 1 for range
            date = _start.shift(days=day).format(DEFAULT_FMT)

            obj = None

            if date in activity_by_day:
                obj = activity_by_day[date]
            else:
                continue # so no

            new = {}
            data = [date]

            for role in ROLES:
                new[role] = 0
                #if not obj is None:
                for user in obj[role]:
                    if user not in current[role]:
                        new[role] += 1
                        current[role].append(user)

                data += [len(obj[role]), new[role], obj[actions[role]]]

            if 'buy_nb' in obj:
                data.append(obj['buy_nb'])
            else:
                data.append(0)

            historical_activity.append(data)

        if len(historical_activity) > 0:
            self.addTable(historical_data, full_data_cols, historical_activity)




        _line = 1
        # pylint: disable=no-member
        #widget 1 : nb creators, nb voters, nb improvements.
        activity.write(_line, 1, _("activity.nb_person_{}".format(activePhase), "reports"), self.styles.item)

        # widget 2 : nb ideas, nb votes, nb credits
        activity.write(_line, 4, _("activity.nb_{}".format(activePhase), "reports"), self.styles.item)

        # widget 3 : participation
        activity.write(_line, 7, _("activity.participation", "reports"), self.styles.item)

        activity_persons = 1
        activity_items = 0

        if activePhase == "phase1":
            activity_items = len(ideas)
            activity_persons = len(contributors)

        if activePhase == "phase2":
            activity_items = obj_count['votes']
            activity_persons = len(unique_users['voters'])

        if activePhase == "phase3":
            activity_items = obj_count['buy_nb']
            activity_persons = obj_count['suggestions']

        activity.write(_line+1, 1, activity_persons, self.styles.nb1)
        activity.write(_line+1, 4, activity_items, self.styles.nb2)
        activity.write(_line+1, 7, len(accepted)/(1.0*total_users), self.styles.nb3)

        # participation
        activity.write_rich_string(_line+2, 7, self.styles.darkblue, _("activity.active", "reports"), self.styles.orange, str(len(accepted)), self.styles.small)
        activity.write_rich_string(_line+3, 7, self.styles.darkblue, _("activity.invited", "reports"), self.styles.orange, str(total_users), self.styles.small)

        # widget 2 : average per day or credits invested

        if current_length > 0:
            if activePhase in ["phase1", "phase2"]:
                activity.write_rich_string(_line+2, 4,
                        self.styles.darkblue, _("activity.average_per_day", "reports"),
                        self.styles.green, str(round(activity_items/current_length,2)),
                        self.styles.small)
            else:
                total_credits = len(self.mission["accepted"]) * self.mission["start_credits"]
                activity.write_rich_string(_line+2, 4,
                        self.styles.darkblue, _("activity.total_credits", "reports"),
                        self.styles.green, str(total_credits),
                        self.styles.small)

        # widget 1 : average per person

        avg_per_person = "0"

        if activePhase == "phase1" and len(contributors) > 0:
            avg_per_person = str(round(len(ideas)/(1.0*len(contributors)),2))

        if activePhase == "phase2" and len(unique_users["voters"]) > 0:
            avg_per_person = str(round(obj_count['votes']/(1.0*len(unique_users['voters'])),2))

        if activePhase == "phase3" and len(self.mission['accepted']) > 0:
            avg_per_person = str(round(obj_count['suggestions']/(1.0*len(self.mission['accepted'])),2))

        #widget 1 : average per person
        activity.write_rich_string(_line+2, 1,
            self.styles.darkblue, _("activity.avg_per_person_{}".format(activePhase), "reports"),
            self.styles.blue, avg_per_person,
            self.styles.small)
        # pylint: enable=no-member

        _line += 5

        date_data = [{
                'title':'activity.date',
                'target':1
            }]

        col_data = {
            'phase1':[ {
                'title':"activity.unit_phase1",  # _("activity.unit_phase1", "reports"),
                    'target':4
                },
                {
                'title':"activity.new_contributors",
                'target':3
            },
            ],
            'phase2':[ {
                'title':"activity.unit_phase2",
                    'target':13
                },
                {
                'title':"activity.new_contributors",
                'target':12
            },],
            'phase3':[{
                'title':"activity.comments",
                    'target':10
            },
            {
                'title':"activity.credits",
                    'target':20
            },
            {
                'title':"activity.suggestions",
                    'target':19
            },
            {
                'title':"activity.new_contributors",
                'target':15
            },]
        }

        defaulCols = [
            {
                'title':"activity.cumulated_contributors",
            },
        ]

        cols = date_data + col_data[activePhase] + defaulCols

        col_titles = list(map(lambda item: _(item['title'], "reports"), cols))

        # pylint: disable=no-member
        activity.write_row(_line, 1, col_titles, self.styles.activity_title)


        _line += 1
        _first_line = _line
        _last_line = _line


        for day in range(0, int(current_length)+2):

            col_nb = 1
            target_cell = None
            for col in cols:
                if 'target' in col:
                    target_cell = "={}!{}".format(historical_data_name, xl_rowcol_to_cell(2+day, col['target']))
                    activity.write_formula(_line, col_nb, target_cell, self.styles.activity_text)
                    col_nb += 1

            date_cell = "={}!{}".format(historical_data_name, xl_rowcol_to_cell(2+day, 1))


            new_cell = target_cell
            sum_cell = "={} + {}".format(xl_rowcol_to_cell(_line, col_nb-1), xl_rowcol_to_cell(_line -1, col_nb))

            if day == 0:
                activity.write_formula(_line, col_nb, new_cell, self.styles.activity_text)
            else:
                activity.write_formula(_line, col_nb, sum_cell, self.styles.activity_text)

            _last_line = _line
            _line += 1

        # pylint: enable=no-member

        # Create a new chart object.

        # Add a series to the chart.

        data_col1 = 2
        #data_col2 = 4
        chart2_type = "area"
        cart2_title = 'cumulated_contributors'
        chart_col = 7

        if activePhase == "phase3":
            data_col1 = 3
            cart2_title = 'suggestions'
            chart2_type = "column"
            chart_col = 8

        first_idea = xl_rowcol_to_cell(_first_line, data_col1)
        last_idea = xl_rowcol_to_cell(_last_line, data_col1)
        data_range = '={}!{}:{}'.format(activity_name, first_idea, last_idea)

        first_date = xl_rowcol_to_cell(_first_line, 1)
        last_date = xl_rowcol_to_cell(_last_line, 1)
        date_range = '={}!{}:{}'.format(activity_name, first_date, last_date)

        first_contrib = xl_rowcol_to_cell(_first_line, 4)
        last_contrib = xl_rowcol_to_cell(_last_line, 4)
        contrib_range = '={}!{}:{}'.format(activity_name, first_contrib, last_contrib)

        chart = workbook.add_chart({'type': 'column'})
        chart.add_series({'values': data_range, 'categories':date_range})
        chart.set_title({
            'name': _("activity.unit_{}".format(activePhase), "reports"),
            'name_font': {
                'name': 'Calibri',
                'color': '#10456F',
            },
        })

        chart2 = workbook.add_chart({'type': chart2_type})
        chart2.add_series({'values': contrib_range, 'categories':date_range})
        chart2.set_title({
            'name': _("activity.{}".format(cart2_title), "reports"),
            'name_font': {
                'name': 'Calibri',
                'color': '#10456F',
            },
        })

        chart.set_legend({'none': True})
        chart2.set_legend({'none': True})

        # Insert the chart into the worksheet.
        activity.insert_chart(chart=chart, col=chart_col, row=7) #G7
        activity.insert_chart(chart=chart2, col=chart_col, row=23) #G23




        if activePhase == "phase3":

            sug_cols = ['title','idea_title','likes_up', 'likes_down', 'nb_comments', 'author_name', 'author_email']

            suggest_headers = self.makeHeaders (sug_cols, 'suggestions')
            suggest_headers.append({
                'header':_('headers.discussion', "reports"),
                # pylint: disable=no-member
                'format':self.styles.default_style
                # pylint: enable=no-member
            })

            suggest_list = []

            s_cnt = 0

            for obj in self.objDict["suggestions"]:
                s_cnt += 1
                suggestion = Suggestion(obj)

                suggestion.updateSelf(db)

                idea = self.ideaDict[suggestion.target_id]
                author = self.getUser(suggestion.creator_id)
                suggestion.addAuthor(author)
                suggestion.addIdea(idea)

                data_item = suggestion.getData(sug_cols)

                link = " "
                if len(suggestion.comments) > 0:
                    com_sheet_name = _("sheetnames.suggestion", "reports", {"nb":s_cnt})
                    link = self.makeCommentsSheet(com_sheet_name, suggestion)

                data_item.append(link)
                suggest_list.append(data_item)


            self.addTable(suggestions, suggest_headers, suggest_list, 1, 1, True)



        data_items = ["firstname", "lastname", "email", "accepted"]

        if activePhase == "phase1":
            data_items += ["nb_ideas", "nb_comments"]

        if activePhase == "phase2":
            data_items += ["nb_votes"]

        if activePhase == "phase3":
            data_items += ["investment", "profit", "profit_pct"]


        user_headers = self.makeHeaders(data_items)
        user_data = []

        for _user in self.userDict:
            user_data.append(self.userDict[_user].getData(data_items))

        self.addTable(user_sheet, user_headers, user_data)

        self.sortWorkbook(workbook)

        workbook.close()
        # save file info
        localfile = self.makeFileData()
        # file = S3.upload_file(localfile) => UPLOAD post email send 
        # + make the move to s3 job ?
        return localfile




