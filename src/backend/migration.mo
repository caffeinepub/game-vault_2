import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";

module {
  type OldOrder = {
    orderId : Nat;
    customerUsername : Text;
    itemName : Text;
    price : Nat;
    paymentMethod : Text;
    paymentReference : Text;
    status : Text;
    timestamp : Int;
    couponCode : ?Text;
  };

  type OldActor = {
    userOrders : Map.Map<Text, List.List<OldOrder>>;
  };

  type NewOrder = {
    orderId : Nat;
    customerUsername : Text;
    itemName : Text;
    price : Nat;
    paymentMethod : Text;
    paymentReference : Text;
    status : Text;
    timestamp : Int;
    couponCode : ?Text;
    deliveryEmail : Text; // New field for email
  };

  type NewActor = {
    userOrders : Map.Map<Text, List.List<NewOrder>>;
  };

  // Helper function to migrate a single order to include the new email field.
  func migrateOrder(oldOrder : OldOrder) : NewOrder {
    { oldOrder with deliveryEmail = "legacy_email@nodata.com" };
  };

  // Perform the full migration for all orders in userOrders.
  func migrateUserOrders(oldOrders : Map.Map<Text, List.List<OldOrder>>) : Map.Map<Text, List.List<NewOrder>> {
    oldOrders.map<Text, List.List<OldOrder>, List.List<NewOrder>>(
      func(username, oldList) {
        oldList.map<OldOrder, NewOrder>(migrateOrder);
      }
    );
  };

  public func run(old : OldActor) : NewActor {
    { userOrders = migrateUserOrders(old.userOrders) };
  };
};
