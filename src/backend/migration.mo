import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type Position = {
    x : Float;
    y : Float;
  };

  type Icon = {
    id : Text;
    iconType : Text;
    position : Position;
    name : Text;
  };

  type Connection = {
    sourceId : Text;
    targetId : Text;
    connectionType : Text;
    color : Text;
  };

  type FreehandDrawing = {
    points : [Position];
    color : Text;
    strokeWidth : Float;
  };

  type Line = {
    startPosition : Position;
    endPosition : Position;
    color : Text;
    strokeWidth : Float;
    isArrow : Bool;
  };

  type TextLabel = {
    content : Text;
    position : Position;
    fontSize : Float;
    color : Text;
    fontWeight : Text;
  };

  type DiagramState = {
    icons : [Icon];
    connections : [Connection];
    freehandDrawings : [FreehandDrawing];
    lines : [Line];
    textLabels : [TextLabel];
    lastModified : Int;
  };

  // Named Diagram with Name Field Addition
  type NamedDiagram = {
    name : Text;
    state : DiagramState;
  };

  type UserProfile = {
    name : Text;
  };

  type OldActor = {
    diagramStore : Map.Map<Principal, DiagramState>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  type NewActor = {
    diagramStore : Map.Map<Principal, Map.Map<Nat, NamedDiagram>>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newDiagramStore = old.diagramStore.map<Principal, DiagramState, Map.Map<Nat, NamedDiagram>>(
      func(_principal, diagram) {
        let userDiagrams = Map.empty<Nat, NamedDiagram>();
        let namedDiagram : NamedDiagram = {
          name = "default";
          state = diagram;
        };
        userDiagrams.add(0, namedDiagram);
        userDiagrams;
      }
    );
    {
      diagramStore = newDiagramStore;
      userProfiles = old.userProfiles;
    };
  };
};
