import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Set "mo:core/Set";
import Iter "mo:core/Iter";

module {
  // Types as of previous version
  type Username = Text;

  type Package = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    features : [Text];
    isActive : Bool;
  };

  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : Text;
    imageUrl : Text;
    isAvailable : Bool;
  };

  type ProductFile = {
    fileId : Nat;
    productId : Nat;
    fileName : Text;
    fileType : Text;
    fileData : Blob;
  };

  type Order = {
    orderId : Nat;
    customerUsername : Text;
    itemName : Text;
    price : Nat;
    paymentMethod : Text;
    paymentReference : Text;
    status : Text;
    timestamp : Int;
    couponCode : ?Text;
    deliveryEmail : Text;
  };

  type OldActor = {
    nextProductId : Nat;
    nextPackageId : Nat;
    nextOrderId : Nat;
    nextFileId : Nat;
    nextAdId : Nat;
    nextMembershipId : Nat;
    nextPromotionRequestId : Nat;
    registeredUsers : Set.Set<Text>;
    products : Map.Map<Nat, Product>;
    packages : Map.Map<Nat, Package>;
    userOrders : Map.Map<Text, List.List<Order>>;
    productFiles : Map.Map<Nat, ProductFile>;
    productFileIndex : Map.Map<Nat, List.List<Nat>>;
    productNameIndex : Map.Map<Text, Nat>;
  };

  public func run(old : OldActor) : OldActor {
    old;
  };
};
