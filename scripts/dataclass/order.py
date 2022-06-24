import arrow
from . import Data
from gcore import const

# this class encapsulates the logic for a mission 
# it is initialized with a Mongo Object 
dbtype = "orders"
class Order(Data):

    def __init__(self, obj):

        #   buyer_id: string;
        #   target_id:string;
        #   currency:string;
        #   buy_nb:number; 
        #   price: number; 

        self.buy_nb = 0 # for pylint
        self.price  = 1 # for pylint
        self.target_id = ""
        self.buyer_id = ""
        self.current_price = 1
        
        super(Order, self).__init__(obj)
        self.dbtype = dbtype
        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DEFAULT_FMT)

    @property
    def profit(self):
        return self.buy_nb*(self.current_price - self.price)