import Text "mo:core/Text";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

actor {
  type ThreatActor = {
    name : Text;
    description : Text;
  };

  type ReportMetadata = {
    title : Text;
    author : Text;
    date : Time.Time;
  };

  public type Report = {
    metadata : ReportMetadata;
    executiveSummary : Text;
    threatActors : [ThreatActor];
    mitreTechniques : [Text];
    iocs : [Text];
    findings : [Text];
  };

  module Report {
    public func compare(report1 : Report, report2 : Report) : Order.Order {
      switch (Text.compare(report1.metadata.title, report2.metadata.title)) {
        case (#equal) { Int.compare(report1.metadata.date, report2.metadata.date) };
        case (other) { other };
      };
    };
  };

  type InternalReport = {
    report : Report;
    id : Nat;
  };

  module InternalReport {
    public func compareByReportTitle(r1 : InternalReport, r2 : InternalReport) : Order.Order {
      Text.compare(r1.report.metadata.title, r2.report.metadata.title);
    };
  };

  let reports = Map.empty<Nat, InternalReport>();

  var reportId = 0;

  public shared ({ caller }) func saveReport(
    title : Text,
    author : Text,
    executiveSummary : Text,
    threatActorNames : [Text],
    threatActorDescriptions : [Text],
    mitreTechniques : [Text],
    iocs : [Text],
    findings : [Text],
  ) : async Nat {
    if (threatActorNames.size() != threatActorDescriptions.size()) {
      Runtime.trap("Mismatch in threat actor names and descriptions");
    };

    let threatActors = Array.tabulate(
      threatActorNames.size(),
      func(i) {
        {
          name = threatActorNames[i];
          description = threatActorDescriptions[i];
        };
      },
    );

    let report : Report = {
      metadata = {
        title;
        author;
        date = Time.now();
      };
      executiveSummary;
      threatActors;
      mitreTechniques;
      iocs;
      findings;
    };

    let internalReport : InternalReport = {
      report;
      id = reportId;
    };

    reports.add(reportId, internalReport);
    reportId += 1;
    internalReport.id;
  };

  public query ({ caller }) func getReport(id : Nat) : async Report {
    switch (reports.get(id)) {
      case (null) { Runtime.trap("Report not found") };
      case (?internalReport) { internalReport.report };
    };
  };

  public query ({ caller }) func getAllReports() : async [Report] {
    reports.values().toArray().sort(InternalReport.compareByReportTitle).map(func(ir) { ir.report });
  };

  public shared ({ caller }) func deleteReport(id : Nat) : async () {
    if (not reports.containsKey(id)) {
      Runtime.trap("Report not found");
    };
    reports.remove(id);
  };
};
