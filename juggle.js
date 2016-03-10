WipCounters = new Mongo.Collection("wipCounters");

if (Meteor.isClient) {
  Template.body.helpers({
      wipCounters: function() {
        return WipCounters.find({});
      }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  var getWipForLabel = function (label) {
    try {
      var result = HTTP.call(
        "GET", "https://api.github.com/orgs/Yoast/issues",
          {
            headers: {
              "Authorization": "token " + process.env.GITHUB_ACCESS_TOKEN,
              "User-Agent": "juggle.meteor.com"
            },
            params: {
              labels: label,
              filter: "all"
            }
          }
        );
      return result.data.length;
    } catch (e) {
      // Got a network error, time-out or HTTP error in the 400 or 500 range.
      return false;
    }
  }

  var getWipForStage = function(inProgressLabel, finishedLabel) {
    var inProgressCount = getWipForLabel( inProgressLabel );

    var wip = 0;

    if ( "number" === typeof inProgressCount ) {
      wip += inProgressCount
    }

    if ( "undefined" !== typeof finishedLabel ) {
      var finishedCount = getWipForLabel( finishedLabel );

      if ( "number" === typeof finishedCount ) {
        wip += finishedCount
      }
    }
    return wip;
  }

  var getDevelopmentWip = function() {
      return getWipForStage( "development", "needs-code-review" );
  }

  var getCodeReviewWip = function() {
      return getWipForStage( "code-review", "needs-acceptance" );
  }

  var getAcceptanceWip = function() {
      return getWipForStage( "acceptance" );
  }

  var updateDevelopmentWip = function() {
      var developmentWip = getDevelopmentWip();
      WipCounters.update({name: "Development"},{$set: {amount: developmentWip}});
  }

  var updateCodeReviewWip = function() {
    var codeReviewWip = getCodeReviewWip();
    WipCounters.update({name: "Code review"},{$set: {amount: codeReviewWip}});
  }

  var updateAcceptanceWip = function() {
    var acceptanceWip = getAcceptanceWip();
    WipCounters.update({name: "Acceptance"},{$set: {amount: acceptanceWip}});
  }

  var updateWipCounters = function() {
    updateDevelopmentWip();
    updateCodeReviewWip();
    updateAcceptanceWip();
  }

  Router.route('/issueEvent', function () {
    var payload = this.request.body
    if ( ["labeled", "unlabeled"].indexOf( payload.action ) !== -1 ) {
      var label = payload.label && payload.label.name;
      var stageLabels = ["development", "needs-code-review", "code-review", "needs-acceptance", "acceptance"];
      if ( stageLabels.indexOf( label ) !== -1 ) {
        updateWipCounters();
      }
    }
    this.response.end("");
  }, {where: 'server'});
}
