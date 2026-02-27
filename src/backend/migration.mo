import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Text "mo:core/Text";
import Set "mo:core/Set";
import Principal "mo:core/Principal";

module {
  type Username = Text;

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
    customerUsername : Username;
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
    customerUsername : Username;
    purchasedAt : Int;
    expiresAt : Int;
    paymentMethod : Text;
    paymentReference : Text;
  };

  // Old state does not have promotionRequests
  type OldActor = {
    nextProductId : Nat;
    nextPackageId : Nat;
    nextOrderId : Nat;
    nextFileId : Nat;
    nextAdId : Nat;
    nextMembershipId : Nat;
    registeredUsers : Set.Set<Text>;
    products : Map.Map<Nat, Product>;
    packages : Map.Map<Nat, Package>;
    userOrders : Map.Map<Username, List.List<Order>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    ads : Map.Map<Nat, Ad>;
    memberships : Map.Map<Nat, Membership>;
    userMemberships : Map.Map<Username, List.List<Nat>>;
    paymentSettings : ?PaymentSettings;
    coupons : Map.Map<Text, Coupon>;
    couponUsages : Map.Map<Text, Set.Set<Text>>;
    productFiles : Map.Map<Nat, ProductFile>;
    productFileIndex : Map.Map<Nat, List.List<Nat>>;
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

  // New state has promotionRequests
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
    userOrders : Map.Map<Username, List.List<Order>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    ads : Map.Map<Nat, Ad>;
    memberships : Map.Map<Nat, Membership>;
    userMemberships : Map.Map<Username, List.List<Nat>>;
    paymentSettings : ?PaymentSettings;
    coupons : Map.Map<Text, Coupon>;
    couponUsages : Map.Map<Text, Set.Set<Text>>;
    productFiles : Map.Map<Nat, ProductFile>;
    productFileIndex : Map.Map<Nat, List.List<Nat>>;
    promotionRequests : Map.Map<Nat, PromotionRequest>;
  };

  public func run(old : OldActor) : NewActor {
    // Initialize promotionRequests as empty
    { old with
      nextPromotionRequestId = 1;
      promotionRequests = Map.empty<Nat, PromotionRequest>();
    };
  };
};
