import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Blob "mo:core/Blob";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

(actor {
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
  var nextFileId = 1;
  var nextAdId = 1;
  var nextMembershipId = 1;
  let registeredUsers = Set.empty<Text>();

  let products = Map.empty<Nat, Product>();
  let packages = Map.empty<Nat, Package>();
  var userOrders = Map.empty<Username, List.List<Order>>();
  var paymentSettings : ?PaymentSettings = null;

  // Coupon System
  let coupons = Map.empty<Text, Coupon>();
  let couponUsages = Map.empty<Text, Set.Set<Username>>();

  // Product File System
  let productFiles = Map.empty<Nat, ProductFile>();
  let productFileIndex = Map.empty<Nat, List.List<Nat>>();

  // User Profile System
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Ads System
  let ads = Map.empty<Nat, Ad>();

  // Membership System
  let memberships = Map.empty<Nat, Membership>();
  let userMemberships = Map.empty<Username, List.List<Nat>>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // User Registration - NO permission checks per requirements
  public shared ({ caller }) func registerUser(username : Text, email : Text) : async () {
    if (registeredUsers.contains(username)) {
      Runtime.trap("Username already exists");
    };
    registeredUsers.add(username);

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
    imageUrl : Text,
  ) : async Nat {
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
    isAvailable : Bool,
  ) : async () {
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
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        products.remove(id);
      };
    };
  };

  public query func listAvailableProducts() : async [Product] {
    products.values().toArray().sort().filter(func(p : Product) : Bool { p.isAvailable });
  };

  public query ({ caller }) func getProduct(id : Nat) : async ?Product {
    products.get(id);
  };

  // Subscription Packages CRUD
  public shared ({ caller }) func createPackage(
    name : Text,
    description : Text,
    price : Nat,
    features : [Text],
  ) : async Nat {
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
    isActive : Bool,
  ) : async () {
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
    switch (packages.get(id)) {
      case (null) { Runtime.trap("Package not found") };
      case (?_) {
        packages.remove(id);
      };
    };
  };

  public query func listActivePackages() : async [Package] {
    packages.values().toArray().sort().filter(func(p : Package) : Bool { p.isActive });
  };

  public query ({ caller }) func getPackage(id : Nat) : async ?Package {
    packages.get(id);
  };

  // Orders with Coupon Support
  public shared ({ caller }) func placeOrder(
    customerUsername : Username,
    itemName : Text,
    price : Nat,
    paymentMethod : Text,
    paymentReference : Text,
    couponCode : ?Text,
    deliveryEmail : Text,
  ) : async Nat {
    if (not registeredUsers.contains(customerUsername)) {
      Runtime.trap("User not registered");
    };

    let finalPrice = switch (couponCode) {
      case (null) { price };
      case (?code) {
        applyCoupon(customerUsername, code, price);
      };
    };

    let orderId = nextOrderId;
    let order : Order = {
      orderId;
      customerUsername;
      itemName;
      price = finalPrice;
      paymentMethod;
      paymentReference;
      status = "pending";
      timestamp = Time.now();
      couponCode;
      deliveryEmail;
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

  // Helper function to validate, apply, and record coupon usage
  func applyCoupon(customerUsername : Username, code : Text, originalPrice : Nat) : Nat {
    let coupon = switch (coupons.get(code)) {
      case (null) { Runtime.trap("Coupon not found") };
      case (?coupon) {
        if (not coupon.isActive) { Runtime.trap("Coupon is not active") };
        if (coupon.maxUses != 0 and coupon.usedCount >= coupon.maxUses) {
          Runtime.trap("Coupon usage limit reached");
        };
        let users = switch (couponUsages.get(code)) {
          case (null) { Set.empty<Username>() };
          case (?u) { u };
        };
        if (users.contains(customerUsername)) {
          Runtime.trap("Coupon already used by this customer");
        };
        coupon;
      };
    };

    // Calculate discount
    let discountedPrice = switch (coupon.discountType) {
      case ("percentage") {
        let percentDiscount = if (originalPrice < 100) {
          0;
        } else {
          (originalPrice : Nat) * coupon.discountValue / 100;
        };
        if (percentDiscount > originalPrice) { 0 } else {
          originalPrice - percentDiscount;
        };
      };
      case ("fixed") {
        if (coupon.discountValue > originalPrice) { 0 } else {
          originalPrice - coupon.discountValue;
        };
      };
      case (_) { Runtime.trap("Invalid discount type") };
    };

    // Record usage
    let updatedCoupon = {
      coupon with
      usedCount = coupon.usedCount + 1;
    };
    coupons.add(code, updatedCoupon);

    let users = switch (couponUsages.get(code)) {
      case (null) {
        let newSet = Set.empty<Username>();
        newSet.add(customerUsername);
        newSet;
      };
      case (?users) {
        users.add(customerUsername);
        users;
      };
    };
    couponUsages.add(code, users);

    discountedPrice;
  };

  public shared ({ caller }) func updateOrderStatus(customerUsername : Username, orderId : Nat, status : Text) : async () {
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
            couponCode = o.couponCode;
            deliveryEmail = o.deliveryEmail;
          };
        } else {
          o;
        };
      }
    );

    userOrders.add(customerUsername, updatedOrders);
  };

  public query ({ caller }) func listAllOrders() : async [(Username, [Order])] {
    userOrders.entries().map<(Username, List.List<Order>), (Username, [Order])>(
      func(entry) { (entry.0, entry.1.toArray()) }
    ).toArray<(Username, [Order])>();
  };

  public query ({ caller }) func getCustomerOrders(customerUsername : Username) : async [Order] {
    switch (userOrders.get(customerUsername)) {
      case (null) { [] };
      case (?orders) { orders.toArray() };
    };
  };

  // Payment Settings
  public shared ({ caller }) func savePaymentSettings(settings : PaymentSettings) : async () {
    paymentSettings := ?settings;
  };

  public query ({ caller }) func getPaymentSettings() : async ?PaymentSettings {
    paymentSettings;
  };

  // Coupon System
  public shared ({ caller }) func createCoupon(
    code : Text,
    discountType : Text,
    discountValue : Nat,
    maxUses : Nat,
    isActive : Bool,
  ) : async () {
    if (coupons.containsKey(code)) {
      Runtime.trap("Coupon code already exists");
    };

    if (discountType != "percentage" and discountType != "fixed") {
      Runtime.trap("Invalid discount type");
    };

    let coupon : Coupon = {
      code;
      discountType;
      discountValue;
      maxUses;
      usedCount = 0;
      isActive;
    };

    coupons.add(code, coupon);
  };

  public shared ({ caller }) func updateCoupon(
    code : Text,
    discountType : Text,
    discountValue : Nat,
    maxUses : Nat,
    isActive : Bool,
  ) : async () {
    let existing = switch (coupons.get(code)) {
      case (null) { Runtime.trap("Coupon not found") };
      case (?c) { c };
    };

    if (discountType != "percentage" and discountType != "fixed") {
      Runtime.trap("Invalid discount type");
    };

    let updatedCoupon : Coupon = {
      code;
      discountType;
      discountValue;
      maxUses;
      usedCount = existing.usedCount;
      isActive;
    };

    coupons.add(code, updatedCoupon);
  };

  public shared ({ caller }) func deleteCoupon(code : Text) : async () {
    if (not coupons.containsKey(code)) {
      Runtime.trap("Coupon not found");
    };

    coupons.remove(code);
    couponUsages.remove(code);
  };

  public query ({ caller }) func listAllCoupons() : async [Coupon] {
    coupons.values().toArray();
  };

  public query ({ caller }) func validateCoupon(code : Text, customerUsername : Username) : async {
    coupon : Coupon;
    soloUse : Bool;
  } {
    let coupon = switch (coupons.get(code)) {
      case (null) { Runtime.trap("Coupon not found") };
      case (?coupon) {
        if (not coupon.isActive) { Runtime.trap("Coupon is not active") };
        if (coupon.maxUses != 0 and coupon.usedCount >= coupon.maxUses) {
          Runtime.trap("Coupon usage limit reached");
        };
        let users = switch (couponUsages.get(code)) {
          case (null) { Set.empty<Username>() };
          case (?u) { u };
        };
        if (users.contains(customerUsername)) {
          Runtime.trap("Coupon already used by this customer");
        };
        coupon;
      };
    };
    { coupon; soloUse = true };
  };

  // Product File Attachments - NO permission checks, anyone can manage attachments
  public shared ({ caller }) func attachFileToProduct(productId : Nat, fileName : Text, fileType : Text, fileData : Blob) : async Nat {
    // Validate fileType
    if (fileType != "lua" and fileType != "apk") {
      Runtime.trap("Invalid file type. Must be 'lua' or 'apk'");
    };

    // Validate product exists
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {};
    };

    let fileId = nextFileId;
    let productFile : ProductFile = {
      fileId;
      productId;
      fileName;
      fileType;
      fileData;
    };

    productFiles.add(fileId, productFile);

    // Update productFileIndex
    let existingFileIds = switch (productFileIndex.get(productId)) {
      case (?ids) { ids };
      case (null) { List.empty<Nat>() };
    };
    existingFileIds.add(fileId);
    productFileIndex.add(productId, existingFileIds);

    nextFileId += 1;
    fileId;
  };

  public shared ({ caller }) func removeFileFromProduct(productId : Nat, fileId : Nat) : async () {
    // Validate file exists
    switch (productFiles.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?_) {};
    };

    // Remove from productFiles
    productFiles.remove(fileId);

    // Update productFileIndex
    switch (productFileIndex.get(productId)) {
      case (null) { Runtime.trap("Product has no files") };
      case (?fileIds) {
        let filtered = fileIds.filter(func(id) { id != fileId });
        productFileIndex.add(productId, filtered);
      };
    };
  };

  public query ({ caller }) func listProductFilesAdmin(productId : Nat) : async [{ fileId : Nat; fileName : Text; fileType : Text }] {
    switch (productFileIndex.get(productId)) {
      case (null) { return [] };
      case (?fileIds) {
        let files = fileIds.toArray().map(
          func(id) {
            switch (productFiles.get(id)) {
              case (null) { null };
              case (?file) {
                ?{
                  fileId = file.fileId;
                  fileName = file.fileName;
                  fileType = file.fileType;
                };
              };
            };
          }
        );
        let filteredFiles = files.filter(func(f) { f != null });
        let resultFiles = filteredFiles.map(
          func(f) {
            switch (f) {
              case (?f) { f };
              case (_) { { fileId = 0; fileName = ""; fileType = "" } };
            };
          }
        );
        resultFiles;
      };
    };
  };

  public query ({ caller }) func listProductFiles(productId : Nat) : async [{ fileId : Nat; fileName : Text; fileType : Text }] {
    switch (productFileIndex.get(productId)) {
      case (null) { return [] };
      case (?fileIds) {
        let files = fileIds.toArray().map(
          func(id) {
            switch (productFiles.get(id)) {
              case (null) { null };
              case (?file) {
                ?{
                  fileId = file.fileId;
                  fileName = file.fileName;
                  fileType = file.fileType;
                };
              };
            };
          }
        );
        let filteredFiles = files.filter(func(f) { f != null });
        let resultFiles = filteredFiles.map(
          func(f) {
            switch (f) {
              case (?f) { f };
              case (_) { { fileId = 0; fileName = ""; fileType = "" } };
            };
          }
        );
        resultFiles;
      };
    };
  };

  public shared ({ caller }) func downloadProductFile(fileId : Nat) : async Blob {
    let file = switch (productFiles.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?f) { f };
    };

    let product = switch (products.get(file.productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };

    let username = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile.username };
    };

    let hasPurchased = switch (userOrders.get(username)) {
      case (null) { false };
      case (?orders) {
        orders.any(func(order) { order.status == "accepted" and order.itemName == product.name });
      };
    };

    if (not hasPurchased) {
      Runtime.trap("Unauthorized: No accepted order for this product");
    };

    file.fileData;
  };

  // Ads System - Public for viewing active ads
  public shared ({ caller }) func createAd(
    adType : Text,
    title : Text,
    description : Text,
    imageUrl : Text,
    linkUrl : Text,
  ) : async Nat {
    if (adType != "image" and adType != "text") {
      Runtime.trap("Invalid ad type. Must be 'image' or 'text'");
    };

    let id = nextAdId;
    let ad : Ad = {
      id;
      adType;
      title;
      description;
      imageUrl;
      linkUrl;
      isActive = true;
      createdAt = Time.now();
    };

    ads.add(id, ad);
    nextAdId += 1;
    id;
  };

  public shared ({ caller }) func updateAd(
    id : Nat,
    adType : Text,
    title : Text,
    description : Text,
    imageUrl : Text,
    linkUrl : Text,
    isActive : Bool,
  ) : async () {
    if (adType != "image" and adType != "text") {
      Runtime.trap("Invalid ad type. Must be 'image' or 'text'");
    };

    let existing = switch (ads.get(id)) {
      case (null) { Runtime.trap("Ad not found") };
      case (?ad) { ad };
    };

    let ad : Ad = {
      id;
      adType;
      title;
      description;
      imageUrl;
      linkUrl;
      isActive;
      createdAt = existing.createdAt;
    };

    ads.add(id, ad);
  };

  public shared ({ caller }) func deleteAd(id : Nat) : async () {
    switch (ads.get(id)) {
      case (null) { Runtime.trap("Ad not found") };
      case (?_) {
        ads.remove(id);
      };
    };
  };

  public query ({ caller }) func listAllAds() : async [Ad] {
    ads.values().toArray();
  };

  public query func listActiveAds() : async [Ad] {
    ads.values().toArray().filter(func(ad : Ad) : Bool { ad.isActive });
  };

  // Ad-Free Membership System
  public shared ({ caller }) func purchaseMembership(
    customerUsername : Username,
    paymentMethod : Text,
    paymentReference : Text,
  ) : async Nat {
    let membershipDuration : Int = 30 * 24 * 60 * 60 * 1_000_000_000; // 30 days in nanoseconds
    let now = Time.now();

    // Check if user has active membership
    let expiresAt : ?Membership = switch (userMemberships.get(customerUsername)) {
      case (null) { null };
      case (?membershipIds) {
        var mostRecentMembership : ?Membership = null;
        let ids = membershipIds.toArray();
        for (id in ids.values()) {
          let membership = memberships.get(id);
          switch (mostRecentMembership, membership) {
            case (null, ?m) { mostRecentMembership := ?m };
            case (?a, ?m) {
              if (m.expiresAt > a.expiresAt) { mostRecentMembership := ?m };
            };
            case _ {};
          };
        };
        mostRecentMembership;
      };
    };

    let finalExpiresAt = switch (expiresAt) {
      case (null) { now + membershipDuration };
      case (?m) {
        if (m.expiresAt > now) {
          // Active membership exists, extend from current expiry
          m.expiresAt + membershipDuration;
        } else {
          // Expired membership, start from now
          now + membershipDuration;
        };
      };
    };

    let membershipId = nextMembershipId;
    let membership : Membership = {
      membershipId;
      customerUsername;
      purchasedAt = now;
      expiresAt = finalExpiresAt;
      paymentMethod;
      paymentReference;
    };

    memberships.add(membershipId, membership);

    // Update user memberships index
    let existingMemberships = switch (userMemberships.get(customerUsername)) {
      case (?ids) { ids };
      case (null) { List.empty<Nat>() };
    };
    existingMemberships.add(membershipId);
    userMemberships.add(customerUsername, existingMemberships);

    nextMembershipId += 1;
    membershipId;
  };

  public query ({ caller }) func getMembershipStatus(customerUsername : Username) : async ?Membership {
    switch (userMemberships.get(customerUsername)) {
      case (null) { null };
      case (?membershipIds) {
        var mostRecentMembership : ?Membership = null;
        let ids = membershipIds.toArray();
        for (id in ids.values()) {
          let membership = memberships.get(id);
          switch (mostRecentMembership, membership) {
            case (null, ?m) { mostRecentMembership := ?m };
            case (?a, ?m) {
              if (m.purchasedAt > a.purchasedAt) { mostRecentMembership := ?m };
            };
            case _ {};
          };
        };
        mostRecentMembership;
      };
    };
  };

  public query ({ caller }) func checkActiveMembership(customerUsername : Username) : async Bool {
    switch (userMemberships.get(customerUsername)) {
      case (null) { false };
      case (?membershipIds) {
        let now = Time.now();
        membershipIds.toArray().any(
          func(id) {
            switch (memberships.get(id)) {
              case (null) { false };
              case (?m) { m.expiresAt > now };
            };
          }
        );
      };
    };
  };

  public query ({ caller }) func listAllMemberships() : async [Membership] {
    memberships.values().toArray();
  };
});
