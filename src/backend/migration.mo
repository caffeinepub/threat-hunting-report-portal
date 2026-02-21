import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";

module {
  // Old diagram state without images.
  type OldActor = {
    diagramStore : Map.Map<Principal, Map.Map<Nat, NamedDiagram>>;
  };

  // Named diagram type.
  type NamedDiagram = {
    name : Text;
    state : {
      icons : [{ id : Text; iconType : Text; position : { x : Float; y : Float }; name : Text }];
      connections : [{
        sourceId : Text;
        targetId : Text;
        connectionType : Text;
        color : Text;
      }];
      freehandDrawings : [{ points : [{ x : Float; y : Float }]; color : Text; strokeWidth : Float }];
      lines : [{
        startPosition : { x : Float; y : Float };
        endPosition : { x : Float; y : Float };
        color : Text;
        strokeWidth : Float;
        isArrow : Bool;
      }];
      textLabels : [{
        content : Text;
        position : { x : Float; y : Float };
        fontSize : Float;
        color : Text;
        fontWeight : Text;
      }];
      lastModified : Int;
    };
  };

  // New diagram state with images.
  type NewActor = {
    diagramStore : Map.Map<Principal, Map.Map<Nat, NamedDiagramWithImages>>;
  };

  type NamedDiagramWithImages = {
    name : Text;
    state : {
      icons : [{ id : Text; iconType : Text; position : { x : Float; y : Float }; name : Text }];
      connections : [{
        sourceId : Text;
        targetId : Text;
        connectionType : Text;
        color : Text;
      }];
      freehandDrawings : [{ points : [{ x : Float; y : Float }]; color : Text; strokeWidth : Float }];
      lines : [{
        startPosition : { x : Float; y : Float };
        endPosition : { x : Float; y : Float };
        color : Text;
        strokeWidth : Float;
        isArrow : Bool;
      }];
      textLabels : [{
        content : Text;
        position : { x : Float; y : Float };
        fontSize : Float;
        color : Text;
        fontWeight : Text;
      }];
      images : [{
        id : Text;
        file : Storage.ExternalBlob;
        position : { x : Float; y : Float };
        size : { width : Float; height : Float };
        name : Text;
        description : Text;
      }];
      lastModified : Int;
    };
  };

  // Migration function called by the main actor via the with-clause.
  public func run(old : OldActor) : NewActor {
    let newDiagramStore = old.diagramStore.map<Principal, Map.Map<Nat, NamedDiagram>, Map.Map<Nat, NamedDiagramWithImages>>(
      func(_user, diagrams) {
        diagrams.map<Nat, NamedDiagram, NamedDiagramWithImages>(
          func(_id, namedDiagram) {
            {
              namedDiagram with
              state = {
                namedDiagram.state with
                images = [];
              };
            };
          }
        );
      }
    );
    { diagramStore = newDiagramStore };
  };
};
