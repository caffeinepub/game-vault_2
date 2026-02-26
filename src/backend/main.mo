import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Set "mo:core/Set";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Persistent Data
  type Username = Text;

  public type UserProfile = {
    username : Text;
    email : Text;
  };

  public type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : Text;
    imageUrl : Text;
    isAvailable : Bool;
  };

  public type Package = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    features : [Text];
    isActive : Bool;
  };

  public type Order = {
    orderId : Nat;
    customerUsername : Username;
    itemName : Text;
    price : Nat;
    paymentMethod : Text;
    paymentReference : Text;
    status : Text;
    timestamp : Int;
  };

  public type PaymentSettings = {
    paypalEmail : Text;
    bitcoinWallet : Text;
    ethereumWallet : Text;
    xboxInstructions : Text;
    amazonInstructions : Text;
    etsyInstructions : Text;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  module Package {
    public func compare(pkg1 : Package, pkg2 : Package) : Order.Order {
      Nat.compare(pkg1.id, pkg2.id);
    };
  };

  // Internal State
  var nextProductId = 1;
  var nextPackageId = 1;
  var nextOrderId = 1;

  let products = Map.empty<Nat, Product>();
  let packages = Map.empty<Nat, Package>();
  let userOrders = Map.empty<Username, List.List<Order>>();
  var paymentSettings : ?PaymentSettings = null;
  let registeredUsers = Set.empty<Text>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // User Registration

  public shared ({ caller }) func registerUser(username : Text, email : Text) : async () {
    // Registration is open to everyone including guests
    if (registeredUsers.contains(username)) {
      Runtime.trap("Username already exists");
    };
    registeredUsers.add(username);

    // Save profile for the caller
    let profile : UserProfile = {
      username;
      email;
    };
    userProfiles.add(caller, profile);
  };

  // Products CRUD

  public shared ({ caller }) func createProduct(
    name : Text,
    description : Text,
    price : Nat,
    category : Text,
    imageUrl : Text
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create products");
    };

    let id = nextProductId;
    let product : Product = {
      id;
      name;
      description;
      price;
      category;
      imageUrl;
      isAvailable = true;
    };

    products.add(id, product);
    nextProductId += 1;
    id;
  };

  public shared ({ caller }) func updateProduct(
    id : Nat,
    name : Text,
    description : Text,
    price : Nat,
    category : Text,
    imageUrl : Text,
    isAvailable : Bool
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        let product : Product = {
          id;
          name;
          description;
          price;
          category;
          imageUrl;
          isAvailable;
        };
        products.add(id, product);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };

    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        products.remove(id);
      };
    };
  };

  public query func listAvailableProducts() : async [Product] {
    // Accessible to everyone including guests
    products.values().toArray().sort().filter(func(p : Product) : Bool { p.isAvailable });
  };

  public query ({ caller }) func getProduct(id : Nat) : async ?Product {
    // Accessible to everyone including guests
    products.get(id);
  };

  // Subscription Packages CRUD

  public shared ({ caller }) func createPackage(
    name : Text,
    description : Text,
    price : Nat,
    features : [Text]
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create packages");
    };

    let id = nextPackageId;
    let package : Package = {
      id;
      name;
      description;
      price;
      features;
      isActive = true;
    };

    packages.add(id, package);
    nextPackageId += 1;
    id;
  };

  public shared ({ caller }) func updatePackage(
    id : Nat,
    name : Text,
    description : Text,
    price : Nat,
    features : [Text],
    isActive : Bool
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update packages");
    };

    switch (packages.get(id)) {
      case (null) { Runtime.trap("Package not found") };
      case (?_) {
        let package : Package = {
          id;
          name;
          description;
          price;
          features;
          isActive;
        };
        packages.add(id, package);
      };
    };
  };

  public shared ({ caller }) func deletePackage(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete packages");
    };

    switch (packages.get(id)) {
      case (null) { Runtime.trap("Package not found") };
      case (?_) {
        packages.remove(id);
      };
    };
  };

  public query func listActivePackages() : async [Package] {
    // Accessible to everyone including guests
    packages.values().toArray().sort().filter(func(p : Package) : Bool { p.isActive });
  };

  public query ({ caller }) func getPackage(id : Nat) : async ?Package {
    // Accessible to everyone including guests
    packages.get(id);
  };

  // Orders

  public shared ({ caller }) func placeOrder(
    customerUsername : Username,
    itemName : Text,
    price : Nat,
    paymentMethod : Text,
    paymentReference : Text
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    if (not registeredUsers.contains(customerUsername)) {
      Runtime.trap("User not registered");
    };

    let orderId = nextOrderId;
    let order : Order = {
      orderId;
      customerUsername;
      itemName;
      price;
      paymentMethod;
      paymentReference;
      status = "pending";
      timestamp = Time.now();
    };

    let existingOrders = switch (userOrders.get(customerUsername)) {
      case (?orders) { orders };
      case (null) { List.empty<Order>() };
    };
    existingOrders.add(order);
    userOrders.add(customerUsername, existingOrders);

    nextOrderId += 1;
    orderId;
  };

  public shared ({ caller }) func updateOrderStatus(customerUsername : Username, orderId : Nat, status : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };

    let orders = switch (userOrders.get(customerUsername)) {
      case (null) { Runtime.trap("Order does not exist") };
      case (?orders) { orders };
    };

    let updatedOrders = orders.map<Order, Order>(
      func(o) {
        if (o.orderId == orderId) {
          {
            orderId = o.orderId;
            customerUsername = o.customerUsername;
            itemName = o.itemName;
            price = o.price;
            paymentMethod = o.paymentMethod;
            paymentReference = o.paymentReference;
            status;
            timestamp = o.timestamp;
          };
        } else {
          o;
        };
      }
    );

    userOrders.add(customerUsername, updatedOrders);
  };

  public query ({ caller }) func listAllOrders() : async [(Username, [Order])] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all orders");
    };

    userOrders.entries().map<(Username, List.List<Order>), (Username, [Order])>(
      func(entry) { (entry.0, entry.1.toArray()) }
    ).toArray<(Username, [Order])>();
  };

  public query ({ caller }) func getCustomerOrders(customerUsername : Username) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    // Get the caller's profile to verify ownership
    let callerProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Caller profile not found") };
      case (?profile) { profile };
    };

    // Users can only view their own orders, admins can view any
    if (callerProfile.username != customerUsername and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };

    switch (userOrders.get(customerUsername)) {
      case (null) { [] };
      case (?orders) { orders.toArray() };
    };
  };

  // Payment Settings

  public shared ({ caller }) func savePaymentSettings(settings : PaymentSettings) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update payment settings");
    };

    paymentSettings := ?settings;
  };

  public query ({ caller }) func getPaymentSettings() : async ?PaymentSettings {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view payment settings");
    };

    paymentSettings;
  };
};
