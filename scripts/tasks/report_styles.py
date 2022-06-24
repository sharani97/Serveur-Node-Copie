import os, json

dir_path = os.path.dirname(os.path.realpath(__file__))


json_file = '{}/mission_styles.json'.format(dir_path)
json_file2 = '{}/header_styles.json'.format(dir_path)

class ReportStyles():

    def __init__(self):
        # load JSON 
        data = None
        with open(json_file) as f:
            data = json.load(f)

        self.data = data

        with open(json_file2) as f2:
            data2 = json.load(f2)

        self.header_styles = data2

    def headerStyle(self, name):
        if name in self.header_styles:
            return getattr(self,  self.header_styles[name])
        else:
            return getattr(self,  self.header_styles["none"])

        return None




    def addStyles(self, workbook): # workbook is and xlswriter workbook
        for key in self.data:
            style = workbook.add_format(self.data[key])
            setattr(self, key, style)
