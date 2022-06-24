import arrow
from gcore import global_vars, mongoapi, const

class Data:
    def __init__(self, *initial_data, **kwargs):

        self._id = None
        self.data = {}
        self.dbtype = "none"
        for dictionary in initial_data:
            for key in dictionary:
                self.data[key] = dictionary[key]
                try:
                    setattr(self, key, dictionary[key])
                except AttributeError:
                    global_vars.logger.warn("can't set attribute {}".format(key))
        
        for key in kwargs:
            try:
                setattr(self, key, kwargs[key])
            except AttributeError:
                global_vars.logger.warn("can't set attribute {}".format(key))

    def __getitem__(self, arg):
        return self.data[arg]

    def __setitem__(self, key, item): 
        self.data[key] = item

    def save(self):
        self.data["updated"] = arrow.now().format(const.DB_DATE_FMT)
        mongoapi.update_object(global_vars.db, self.dbtype, self.data)

    def update_field(self, key, value):
        self.data[key] = value
        self.__setattr__(key, value)
        self.save()

    def update_fields(self, _dict):
        for key in _dict:
            value = _dict[key]
            self.data[key] = value
            self.__setattr__(key, value)
        
        self.save()

    def getData(self, items):
        ret = []

        for item in items:

            data = None 
            if item in self.data:
                data = self.data[item]
            else:
                if item in self.__dict__:
                    data = self.__dict__[item]

            if data is None:
                data = getattr(self, item)

            if data is None:
                raise Exception("Item {} not found in dataclass".format(item))
            else:
                ret.append(data)
            
        return ret