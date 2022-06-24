
from gcore import mongoapi
from . import missions
import xlsxwriter 
import arrow
from dataclass import Job
from xlsxwriter.utility import xl_rowcol_to_cell
from tasks import S3Sender


from tasks.mission_report import MissionReport 
logger = None 

topdarkblue = "#10456F"
primary = "#2196F3"

def set_logger(_logger):
    global logger
    logger = _logger 


def create_mission_report(job, DB, CONF):

    _job = Job(job)
    taskname = job["task"]

    mission_id = job["payload"]["mission_id"]

    try:
        reporter = MissionReport(mission_id)
    except ValueError:
        logger.warn(" No such mission for report : {}".format(str(mission_id)))
        return True, {}

    filedata = reporter.run()
    if filedata is None:
        raise Exception("No file data returned")

    _job.set_payload_field('file', reporter.filename); 
    _job.set_payload_field('filedata', filedata.data, True);#this saves it
    
    S3Sender.upload_file(filedata)

    if "email" in job["payload"]:
        payload = {
            "file":reporter.filename,
            "email":job["payload"]["email"],
            "mission":reporter.mission
        }
        _new_job = mongoapi.make_job('message.new_mission_report', payload, mongoapi.tool_user['_id'])

        return True, _new_job #create job to actually *send* the damn thing 

    return True, {}

def create_admin_report(job, DB, CONF):
    
    taskname = job["task"]

    # Create an new Excel file and add a worksheet.
    filename = 'temp/adminreport_{}.xlsx'.format(arrow.now().format('YYYY-MM-DD-HHmm'))
    workbook = xlsxwriter.Workbook(filename)
    worksheet = workbook.add_worksheet('REPORT')

    # Add a bold format to use to highlight cells.
    bold = workbook.add_format({'bold': True})
    
    white = workbook.add_format({ "bg_color":"#FFFFFF"})



    main_title = workbook.add_format({
        'bold': True, 
        'align': 'center',
        'font_size':35,
        'font_color':"#012d52", 
        "fg_color":"#FFFFFF"
    })

    title = workbook.add_format({
        'bold': True, 
        'align': 'center',
        'font_color':"#7fc800", 
        "fg_color":"#012d52"
    })

    worksheet.set_column('A:A', 5, white)

    worksheet.set_column('B:Z', 20) #, white)
    
    # deep_blue 012d52
    # bright_green 7fc800

    _line = 1 

    worksheet.merge_range(_line, 1, _line, 5, "ADMIN REPORT", main_title) 
    _line += 1

    ORG_CURSOR = DB.organizations.find({})

    for org in ORG_CURSOR:

        _line = _line + 1
        # Write some simple text.        
        worksheet.merge_range(_line, 1, _line, 5, "ORG : {}".format(org["name"]), title) 

        _line = _line + 1 

        data = []

        MISSION_CURSOR = DB.missions.find({
            "org":org['_id']
        })


        for mission in MISSION_CURSOR:
            
            IDEA_CURSOR = DB.ideas.find({"mission_id":mission['_id']})

            id_count = 0 
            active_id_count = 0 

            for idea in IDEA_CURSOR:
                id_count += 1 
                if idea["active"]:
                    active_id_count += 1 

            data_line = [mission["title"], mission["state"], active_id_count, id_count, missions.get_phase(mission)]
            data.append(data_line)


        options = {
            'data': data,
            'autofilter': 1,
            'first_column': True,
            'style': 'Table Style Light 1',
            'columns': [
                {'header': 'Mission'},
                {'header': 'State'},
                {'header': 'Active Ideas'},                        
                {'header': 'Total Ideas'},
                {'header': 'Phase'}
            ]
        }

        # Add a table to the worksheet.
        if len(data)> 0:
            worksheet.add_table(
                first_row=_line, first_col=1, 
                last_row=_line+len(data), last_col= 5, 
                options= options)

                #"{}:{}".format(xl_rowcol_to_cell(_line, 1), xl_rowcol_to_cell(_line+len(data),5)), 
                #options)
                #(
 
                

        _line += len(data) + 1




    # Write some numbers, with row/column notation.
    #worksheet.write(2, 0, 123)
    #worksheet.write(3, 0, 123.456)

    # Insert an image.
    workbook.close()
    payload = {
        "file":filename
    }
    _new_job = mongoapi.make_job('message.new_admin_report', payload, mongoapi.tool_user['_id'])
    return True, _new_job #create job to actually *send* the damn thing 


tasks  ={
    "report.admin_all":create_admin_report,
    "report.mission": create_mission_report,
}