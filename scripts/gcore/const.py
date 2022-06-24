DEFAULT_FMT = "DD/MM/YYYY"

DB_DATE_FMT = "YYYY-MM-DD HH:mm:ssZ"


#job constants

'''
    'warn.friendship_request':friendship_warn,
    'warn.friendship_accepted': friendship_warn,
    'warn.user_commented': comment_warn,
    'warn.user_liked': like_warn,
    'warn.user_messaged':chat_warn

'''

JOB_CRON_WEEKLY_NOTFS       = "warn.weekly_notifs"
JOB_CRON_MIDMONTH_INVITES   = "warn.mid_month_invites"
JOB_CRON_COME_AND_POST      = "warn.come_and_post"
JOB_CRON_ADMIN_REPORT       = "report.admin_all"
JOB_CRON_MIDWEEK_INVITES    = "warn.mid_week_invites"



JOB_WARN_FRIEND_REQUEST     = "warn.friendship_request"
JOB_WARN_FRIEND_ACCEPTED    = "warn.friendship_accepted"
JOB_WARN_USER_COMMENTED     = "warn.user_commented"
JOB_WARN_USER_LIKED         = "warn.user_liked"
JOB_WARN_USER_MESSAGED      = "warn.user_messaged"

JOB_WARN_USER_POSTED        = "warn.user_posted"

JOB_MISSION_LOCKED = "warn.mission_locked"
JOB_MISSION_IN_PROGRESS = "warn.mission_in_progress"
JOB_MISSION_CHECK_PHASE_END = "mission.check_phase_end"

JOB_VALIDATE_EMAIL = 'warn.user_created_validate_email'

JOB_WARN_USER_PROMOTED_ORGADMIN = 'warn.user_promoted_to_orgadmin'
JOB_WARN_USER_PROMOTED_ENTADMIN = 'warn.user_promoted_to_entadmin'
JOB_WARN_USER_INVITED_ORGADMIN = 'warn.user_invited_to_orgadmin'
JOB_FORGOTTEN_PASSWORD = 'warn.forgotten_password'
JOB_ADMIN_REPORT ='message.new_admin_report'
JOB_MISSION_REPORT = 'message.new_mission_report'

JOB_SEND_DELETE_EMAIL = "user.requested_delete"



# notif constants
NOTIF_MISSION_LOCKED   = 'mission_locked'
NOTIF_MISSION_FINISHED = 'mission_finished'

NOTIF_MISSION_LOCKED_CALLING   = 'mission_locked_calling'

NOTIF_MISSION3_CALLING  = "mission3_calling"
NOTIF_MISSION2_CALLING  = "mission2_calling"
NOTIF_MISSION1_CALLING  = "mission1_calling"

NOTIF_MISSION3_THANKYOU  = "mission3_thankyou"
NOTIF_MISSION2_THANKYOU  = "mission2_thankyou"
NOTIF_MISSION1_THANKYOU  = "mission1_thankyou"


NOTIF_USER_COMMENTED   = "user_commented"
NOTIF_USER_SUGGESTED   = "user_suggested"
NOTIF_USER_POSTED      = "user_posted"
NOTIF_USER_COMMENTED_MISSION = "user_commented_mission"
NOTIF_USER_COMMENTED_IDEA = "user_commented_idea"
NOTIF_USER_COMMENTED_SUGGESTION = "user_commented_suggestion"

NOTIF_USER_MESSAGED    = "user_messaged"

NOTIF_FRIENDSHIP_ACCEPTED = "friendship_accepted"
NOTIF_FRIENDSHIP_REQUEST  = "friendship_request"

action_notifs = [
    NOTIF_MISSION_LOCKED,
    NOTIF_FRIENDSHIP_REQUEST,
    NOTIF_USER_COMMENTED_MISSION,
    NOTIF_USER_COMMENTED_IDEA,
    NOTIF_USER_COMMENTED_SUGGESTION,
    NOTIF_USER_POSTED,
    NOTIF_USER_MESSAGED,
    NOTIF_MISSION1_CALLING,
    NOTIF_MISSION2_CALLING
#   NOTIF_MISSION3_CALLING
]

# email constants
EMAIL_VALIDATE_EMAIL = 'confirm'
EMAIL_RESET_PASSWORD_REQUEST = 'reset_password'
EMAIL_ADMIN_REPORT = 'new_admin_report'
EMAIL_MISSION_REMINDER = 'mid_mission_reminder'

EMAIL_MISSION_REPORT = 'new_mission_report'
EMAIL_MID_MISSION_REPORT = 'mid_mission_report'
EMAIL_END_OF_MISSION_REPORT = 'end_of_mission_report'

EMAIL_MISSION_STARTED = NOTIF_MISSION_LOCKED
EMAIL_MISSION_FINISHED = NOTIF_MISSION_FINISHED

EMAIL_INVITE_ORGADMIN = 'invite_orgadmin'
EMAIL_PROMOTE_ORGADMIN = 'promote_orgadmin'
EMAIL_PROMOTE_ENTADMIN = 'promote_entadmin'

EMAIL_USER_POSTED = NOTIF_USER_POSTED
