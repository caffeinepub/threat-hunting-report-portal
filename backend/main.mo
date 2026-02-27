import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  // Position Types
  public type Position = {
    x : Float;
    y : Float;
  };

  // Icon Types
  public type Icon = {
    id : Text;
    iconType : Text;
    position : Position;
    name : Text;
  };

  // Connection Types
  public type Connection = {
    sourceId : Text;
    targetId : Text;
    connectionType : Text;
    color : Text;
  };

  // Freehand Drawing Types
  public type FreehandDrawing = {
    points : [Position];
    color : Text;
    strokeWidth : Float;
  };

  // Line and Arrow Types
  public type Line = {
    startPosition : Position;
    endPosition : Position;
    color : Text;
    strokeWidth : Float;
    isArrow : Bool;
  };

  // Text Label Types
  public type TextLabel = {
    content : Text;
    position : Position;
    fontSize : Float;
    color : Text;
    fontWeight : Text;
  };

  // Image Types
  public type Image = {
    id : Text;
    file : Storage.ExternalBlob;
    position : Position;
    size : {
      width : Float;
      height : Float;
    };
    name : Text;
    description : Text;
  };

  // Complete Diagram State
  public type DiagramState = {
    icons : [Icon];
    connections : [Connection];
    freehandDrawings : [FreehandDrawing];
    lines : [Line];
    textLabels : [TextLabel];
    images : [Image];
    lastModified : Int;
  };

  // Named Diagram
  public type NamedDiagram = {
    name : Text;
    state : DiagramState;
  };

  public type UserProfile = {
    name : Text;
  };

  let diagramStore = Map.empty<Principal, Map.Map<Nat, NamedDiagram>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let idCounters = Map.empty<Principal, Nat>();
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  // User Profile Functions
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

  // Save a named diagram state
  public shared ({ caller }) func saveDiagramState(name : Text, state : DiagramState) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save diagram state");
    };

    // Fetch or create user diagrams
    let userDiagrams = switch (diagramStore.get(caller)) {
      case (null) { Map.empty<Nat, NamedDiagram>() };
      case (?existing) { existing };
    };

    // Fetch the next available ID for the user
    let id = switch (idCounters.get(caller)) {
      case (null) { 0 };
      case (?counter) { counter };
    };

    let namedDiagram : NamedDiagram = { name; state };
    userDiagrams.add(id, namedDiagram);

    // Save user diagrams back
    diagramStore.add(caller, userDiagrams);

    // Update the user's next available ID
    idCounters.add(caller, id + 1);

    id;
  };

  // Delete saved diagram state
  public shared ({ caller }) func deleteDiagramState(diagramId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (diagramStore.get(caller)) {
      case (?userDiagrams) {
        if (not userDiagrams.containsKey(diagramId)) {
          Runtime.trap("No diagram with id " # diagramId.toText() # " found");
        };
        userDiagrams.remove(diagramId);
        diagramStore.add(caller, userDiagrams);
        ();
      };
      case (null) {
        Runtime.trap("No diagrams found for user");
      };
    };
  };

  // Retrieve a specific diagram state by ID
  public query ({ caller }) func getDiagramStateById(id : Nat) : async ?NamedDiagram {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access diagram state");
    };

    switch (diagramStore.get(caller)) {
      case (?userDiagrams) { userDiagrams.get(id) };
      case (null) { null };
    };
  };

  // Get all icon positions for a specific diagram
  public query ({ caller }) func getAllIconPositions(diagramId : Nat) : async ?[Icon] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access icon positions");
    };

    switch (diagramStore.get(caller)) {
      case (?userDiagrams) {
        switch (userDiagrams.get(diagramId)) {
          case (?diagram) { ?diagram.state.icons };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  // Get all connections for a specific diagram
  public query ({ caller }) func getAllConnections(diagramId : Nat) : async ?[Connection] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access connections");
    };

    switch (diagramStore.get(caller)) {
      case (?userDiagrams) {
        switch (userDiagrams.get(diagramId)) {
          case (?diagram) { ?diagram.state.connections };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  // Retrieve all diagrams of a user
  public query ({ caller }) func getAllDiagrams() : async [NamedDiagram] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access diagrams");
    };

    switch (diagramStore.get(caller)) {
      case (?userDiagrams) {
        userDiagrams.values().toArray();
      };
      case (null) { [] };
    };
  };

  // Update the name of a specific diagram
  public shared ({ caller }) func updateDiagramName(id : Nat, newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update diagram names");
    };

    switch (diagramStore.get(caller)) {
      case (?userDiagrams) {
        switch (userDiagrams.get(id)) {
          case (?diagram) {
            let updatedDiagram : NamedDiagram = { diagram with name = newName };
            userDiagrams.add(id, updatedDiagram);
          };
          case (null) {
            Runtime.trap("Diagram with ID " # id.toText() # " not found");
          };
        };
      };
      case (null) {
        Runtime.trap("No diagrams found for user");
      };
    };
  };
};
