import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Int "mo:core/Int";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Constant for 30 days in nanoseconds (approximate Ethiopian month)
  let THIRTY_DAYS : Int = 30 * 24 * 60 * 60 * 1_000_000_000;

  // Custom types
  type RegistrationStatus = {
    #pending : ?Text; // Optional reason
    #approved : ?Text;
    #rejected : ?Text; // Optional reason
    #expired : ?Text;
  };

  public type StudentProfile = {
    phone : Text;
    email : Text;
    paymentBillId : Storage.ExternalBlob;
    profilePhotoId : Storage.ExternalBlob;
    schoolDocumentId : Storage.ExternalBlob;
    deviceFingerprint : Text;
    subscriptionStart : ?Time.Time;
    subscriptionEnd : ?Time.Time;
    status : RegistrationStatus;
    creationTime : Time.Time;
  };

  module StudentProfile {
    public func compareByCreationTime(profile1 : StudentProfile, profile2 : StudentProfile) : Order.Order {
      Int.compare(profile1.creationTime, profile2.creationTime);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  // Maps
  let studentProfiles = Map.empty<Principal, StudentProfile>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let existingEmails = Map.empty<Text, Principal>();
  let existingPhoneNumbers = Map.empty<Text, Principal>();
  let existingDeviceFingerprints = Map.empty<Text, Principal>();

  // Include external dependencies
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  let approvalState = UserApproval.initState(accessControlState);

  // Helper function to check if student is approved
  func isStudentApproved(student : StudentProfile) : Bool {
    switch (student.status) {
      case (#approved(_)) { true };
      case (_) { false };
    };
  };

  // Helper function to check if subscription is currently active
  func hasActiveSubscription(student : StudentProfile) : Bool {
    let now = Time.now();
    switch (student.subscriptionStart, student.subscriptionEnd) {
      case (?start, ?end) {
        now >= start and now <= end;
      };
      case (_, _) { false };
    };
  };

  // User profile functions required by frontend
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
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

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(
      approvalState,
      caller,
    );
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  // Student functions
  public query ({ caller }) func getRemainingDays() : async ?Int {
    switch (studentProfiles.get(caller)) {
      case (null) { Runtime.trap("Not registered") };
      case (?student) {
        if (not isStudentApproved(student)) {
          Runtime.trap("Unauthorized: Student not approved");
        };
        switch (student.subscriptionEnd) {
          case (null) { Runtime.trap("No active subscription") };
          case (?end) {
            let remaining_nanoseconds = end - Time.now();
            let remaining_days = remaining_nanoseconds / (24 * 60 * 60 * 1_000_000_000);
            if (remaining_days < 0) { ?0 } else {
              ?remaining_days;
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func isSubscriptionActive() : async Bool {
    switch (studentProfiles.get(caller)) {
      case (null) { Runtime.trap("Not registered") };
      case (?student) {
        if (not isStudentApproved(student)) {
          Runtime.trap("Unauthorized: Student not approved");
        };
        hasActiveSubscription(student);
      };
    };
  };

  // Admin-only functions
  public query ({ caller }) func getActiveStudents() : async [StudentProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view active students");
    };
    let now = Time.now();
    let activeStudents = studentProfiles.values().filter(
        func(student) {
          switch (student.subscriptionEnd) {
            case (null) { false };
            case (?end) { end > now };
          };
        }
      ).toArray();
    Array.sort(activeStudents, StudentProfile.compareByCreationTime);
  };

  public query ({ caller }) func getExpiredStudents() : async [StudentProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view expired students");
    };
    let now = Time.now();
    let expiredStudents = studentProfiles.values().filter(
        func(student) {
          switch (student.subscriptionEnd) {
            case (null) { false };
            case (?end) { end < now };
          };
        }
      ).toArray();
    Array.sort(expiredStudents, StudentProfile.compareByCreationTime);
  };

  public query ({ caller }) func listPendingRegistrations() : async [(Principal, StudentProfile)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view pending registrations");
    };
    studentProfiles.entries().filter<(Principal, StudentProfile)>(
        func((_, student)) { 
          switch (student.status) { 
            case (#pending(_)) { true }; 
            case (_) { false }; 
          } 
        }
      ).toArray();
  };

  // Public query functions (no special authorization needed)
  public query ({ caller }) func isRegistered() : async Bool {
    studentProfiles.containsKey(caller);
  };

  public query ({ caller }) func isEmailTaken(email : Text) : async Bool {
    existingEmails.containsKey(email);
  };

  // Student function to submit registration (any authenticated user)
  public shared ({ caller }) func submitRegistration(
    phone : Text,
    email : Text,
    profilePhotoId : Storage.ExternalBlob,
    schoolDocumentId : Storage.ExternalBlob,
    paymentBillId : Storage.ExternalBlob,
    deviceFingerprint : Text
  ) : async () {
    // Ensure device fingerprint uniqueness
    switch (existingDeviceFingerprints.get(deviceFingerprint)) {
      case (?existingOwner) {
        if (existingOwner != caller) { Runtime.trap("Device already registered") };
      };
      case (null) {
        existingDeviceFingerprints.add(deviceFingerprint, caller);
      };
    };

    // Ensure email uniqueness
    switch (existingEmails.get(email)) {
      case (?existingOwner) {
        if (existingOwner != caller) { Runtime.trap("Email already registered") };
      };
      case (null) {
        existingEmails.add(email, caller);
      };
    };

    // Ensure phone number uniqueness
    switch (existingPhoneNumbers.get(phone)) {
      case (?existingOwner) {
        if (existingOwner != caller) { Runtime.trap("Phone number already registered") };
      };
      case (null) {
        existingPhoneNumbers.add(phone, caller);
      };
    };

    let currentTime = Time.now();

    let studentProfile = {
      phone;
      email;
      paymentBillId;
      deviceFingerprint;
      profilePhotoId;
      schoolDocumentId;
      subscriptionStart = null;
      subscriptionEnd = null;
      status = #pending(null);
      creationTime = currentTime;
    };
    studentProfiles.add(caller, studentProfile);
  };

  // Admin-only: Approve registration
  public shared ({ caller }) func approveRegistration(student : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve");
    };

    switch (studentProfiles.get(student)) {
      case (null) { Runtime.trap("Student not found") };
      case (?profile) {
        switch (profile.status) {
          case (#pending(_)) {
            let currentTime = Time.now();
            let updatedProfile = {
              phone = profile.phone;
              email = profile.email;
              paymentBillId = profile.paymentBillId;
              profilePhotoId = profile.profilePhotoId;
              schoolDocumentId = profile.schoolDocumentId;
              deviceFingerprint = profile.deviceFingerprint;
              subscriptionStart = ?currentTime;
              subscriptionEnd = ?(currentTime + THIRTY_DAYS);
              status = #approved(null);
              creationTime = profile.creationTime;
            };
            studentProfiles.add(student, updatedProfile);
            UserApproval.setApproval(approvalState, student, #approved);
          };
          case (_) { Runtime.trap("Student is not pending approval") };
        };
      };
    };
  };

  // Admin-only: Reject registration
  public shared ({ caller }) func rejectRegistration(student : Principal, reason : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject");
    };

    switch (studentProfiles.get(student)) {
      case (null) { Runtime.trap("Student not found") };
      case (?profile) {
        switch (profile.status) {
          case (#pending(_)) {
            let updatedProfile = {
              phone = profile.phone;
              email = profile.email;
              paymentBillId = profile.paymentBillId;
              profilePhotoId = profile.profilePhotoId;
              schoolDocumentId = profile.schoolDocumentId;
              deviceFingerprint = profile.deviceFingerprint;
              subscriptionStart = null;
              subscriptionEnd = null;
              status = #rejected(reason);
              creationTime = profile.creationTime;
            };
            studentProfiles.add(student, updatedProfile);
            UserApproval.setApproval(approvalState, student, #rejected);
          };
          case (_) { Runtime.trap("Student is not pending approval") };
        };
      };
    };
  };
};
