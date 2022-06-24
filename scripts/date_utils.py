import arrow
import re

month_aliases = [
    {"k":"-","v":"/"},
    {"k":" ","v":"/"},
    {"k":"janv","v":"01"},
    {"k":"jan","v": "01"},
    {"k":"févr","v": "02"},
    {"k":"fev","v": "02"},
    {"k":"mars","v": "03"},
    {"k":"avr","v": "04"},
    {"k":"mai","v": "05"},
    {"k":"juin","v": "06"},
    {"k":"juil","v": "07"},
    {"k":"aout","v": "08"},
    {"k":"août","v": "08"},
    {"k":"sept","v": "09"},
    {"k":"oct","v": "10"},
    {"k":"nov","v": "11"},
    {"k":"déc","v":"12"}
]

month_length = {
    "01":31,
    "02":28,
    "03":31,
    "04":30,
    "05":31,
    "06":30,
    "07":31,
    "08":31,
    "09":30,
    "10":31,
    "11":30,
    "12":31
}

euro_date_short = re.compile("^\d\d\/\d\d\/\d\d$")
euro_date_long = re.compile("^\d\d\/\d\d\/\d\d\d\d$")


format_date = re.compile("^ep\.?\w?\d+-\d+\w?:?\w?-?ep\.?\w?\d+-\d+")



def parse_date(date):

    date = date.lower()

    original_date = date

    if euro_date_short.match(date):
        return arrow.get(date, 'DD/MM/YY')

    if euro_date_long.match(date):
        return arrow.get(date, 'DD/MM/YYYY')

    date = str(date).split("T")[0]

    for alias in month_aliases:
        date = date.replace(alias["k"], alias["v"])

    bits = date.split("/")

    if int(bits[1]) < 10:
        bits[1] = "0{}".format(int(bits[1]))

    month = bits[1]

    day = min(int(bits[0]),month_length[month])

    if day < 10:
        day = "0{}".format(day)

    bits[0] = str(day)
    if len(bits[2]) < 4:
        bits[2] = "20{}".format(bits[2])

    date = "/".join(bits)

    try:
        return arrow.get(date, 'DD/MM/YYYY')
    except ValueError:
        raise AssertionError("problem with date : {}".format(original_date))



def parse_date_format(date):

    format = {
        "eps":"all"
    }

    new_date = parse_date(date)

    return [[new_date, format]]
