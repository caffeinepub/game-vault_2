import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type UserProfile = {
    username : Text;
    email : Text;
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

  type Package = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    features : [Text];
    isActive : Bool;
  };

  type Coupon = {
    code : Text;
    discountType : Text;
    discountValue : Nat;
    maxUses : Nat;
    usedCount : Nat;
    isActive : Bool;
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

  type PaymentSettings = {
    paypalEmail : Text;
    bitcoinWallet : Text;
    ethereumWallet : Text;
    xboxInstructions : Text;
    amazonInstructions : Text;
    etsyInstructions : Text;
  };

  type Ad = {
    id : Nat;
    adType : Text;
    title : Text;
    description : Text;
    imageUrl : Text;
    linkUrl : Text;
    isActive : Bool;
    createdAt : Int;
  };

  type Membership = {
    membershipId : Nat;
    customerUsername : Text;
    purchasedAt : Int;
    expiresAt : Int;
    paymentMethod : Text;
    paymentReference : Text;
  };

  type PromotionRequest = {
    id : Nat;
    submitterUsername : Text;
    promotionType : Text;
    link : Text;
    description : Text;
    imageUrl : Text;
    status : Text;
    createdAt : Int;
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
    paymentSettings : ?PaymentSettings;
    coupons : Map.Map<Text, Coupon>;
    couponUsages : Map.Map<Text, Set.Set<Text>>;
    productFiles : Map.Map<Nat, ProductFile>;
    productFileIndex : Map.Map<Nat, List.List<Nat>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    ads : Map.Map<Nat, Ad>;
    memberships : Map.Map<Nat, Membership>;
    userMemberships : Map.Map<Text, List.List<Nat>>;
    promotionRequests : Map.Map<Nat, PromotionRequest>;
  };

  type NewActor = {
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
    paymentSettings : ?PaymentSettings;
    coupons : Map.Map<Text, Coupon>;
    couponUsages : Map.Map<Text, Set.Set<Text>>;
    productFiles : Map.Map<Nat, ProductFile>;
    productFileIndex : Map.Map<Nat, List.List<Nat>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    ads : Map.Map<Nat, Ad>;
    memberships : Map.Map<Nat, Membership>;
    userMemberships : Map.Map<Text, List.List<Nat>>;
    promotionRequests : Map.Map<Nat, PromotionRequest>;
    productNameIndex : Map.Map<Text, Nat>;
  };

  public func run(old : OldActor) : NewActor {
    let productNameIndex = old.products.foldLeft(
      Map.empty<Text, Nat>(),
      func(acc, productId, product) {
        let lowercaseName = product.name.toLower();
        acc.add(lowercaseName, productId);
        acc;
      },
    );

    {
      old with
      productNameIndex;
    };
  };
};
