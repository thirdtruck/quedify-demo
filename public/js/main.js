var uiEventDispatch = _.extend({}, Backbone.Events); 

var Event = Backbone.Model.extend({
  idAttribute: "_id",
  defaults: {
    "title": null,
    "from": null,
    "to": null,
    "location": null,
    "description": null,
    "participants": [],
  },
});

var Events = Backbone.Collection.extend({
  model: Event,
  url: '/events',
  initialize: function (options) {
    var events = this;
    events.searchQuery = options.searchQuery;

    events.listenTo(uiEventDispatch, "newEventCreated", function (newEvent) {
      events.add(newEvent);
    });

    events.listenTo(uiEventDispatch, "eventsModified", function () {
      events.sync("update", events);
    });

    events.listenTo(uiEventDispatch, "searchQueryModified", function () {
      // TODO: Use an event queue and setTimeout to rate-limit these queries
      events.fetch({ data: events.searchQuery.attributes });
    });
  },
});

var SearchQuery = Backbone.Model.extend({
  defaults: {
    titleStartsWith: '',
  },
});

var SearchQueryView = Backbone.View.extend({
  events: {
    keyup: function () {
      this.model.set('titleStartsWith', this.$el.val());
      uiEventDispatch.trigger("searchQueryModified");
    },
  },
});

var EventOption = Backbone.View.extend({
  events: {
    "click" : function () {
      uiEventDispatch.trigger("eventSelected", this.model);
    }
  },
  render: function () {
    this.$el.attr('value', this.model.id);
    this.$el.text(this._optionLabel());
  },
  _optionLabel: function () {
    var title = this.model.get("title");
    var from = this.model.get("from") || "";
    var to = this.model.get("to") || "";

    // TODO: Use a template
    var label = title + (_.isEmpty(from) ? "" : " " + from) + (_.isEmpty(to) ? "" : "-" + to);

    return label;
  }
});

var EventSearch = Backbone.View.extend({
  initialize: function () {
    this.$searchResults = this.$el.find('[name="searchResults"]');
    this.listenTo(this.model, "all", this.render); // TODO: Respond to less events to avoid extraneous renderings
  },
  render: function () {
    var $searchResults = this.$searchResults;

    $searchResults.empty();

    this.model.each(function (evt) {
      var $option = $("<option/>");
      var option = new EventOption({ model: evt, el: $option });
      option.render();
      $searchResults.append(option.$el);
    });

    var $optionNew = $('<option/>');
    var eventNew = new Event({ title: "(New)" });
    var optionNew = new EventOption({ model: eventNew, el: $optionNew });
    optionNew.render();

    $searchResults.append(optionNew.$el);
  },
});

var CreateUpdateEventView = Backbone.View.extend({
  initialize: function () {
    this.listenTo(uiEventDispatch, "eventSelected", function (evt) {
      this.model = evt;
    });
  },
  events: {
    "click": function () {
      uiEventDispatch.trigger("eventCreatedOrUpdated");
    },
  },
});

var DeleteEventView = Backbone.View.extend({
  initialize: function () {
    this.listenTo(uiEventDispatch, "eventSelected", function (evt) {
      this.model = evt;
    });
  },
  events: {
    "click": function () {
      uiEventDispatch.trigger("eventDeleted");
    },
  },
});

var CurrentEventView = Backbone.View.extend({
  initialize: function () {
    this.$selectedTitle = this.$el.find('.selectedTitle');
    this.$title = this.$el.find('[name="title"]');
    this.$from = this.$el.find('[name="from"]');
    this.$to = this.$el.find('[name="to"]');
    this.$location = this.$el.find('[name="location"]');
    this.$description = this.$el.find('[name="description"]');
    this.$participants = this.$el.find('[name="participants"]');

    this.listenTo(uiEventDispatch, "eventSelected", function (evt) {
      this.model = evt;
      this.render();
    });

    this.listenTo(uiEventDispatch, "eventCreatedOrUpdated", function () {
      if (! this.model) { // e.g. before the user has selected their first event
        return;
      }

      var isNewEvent = this.model._id ? false : true;

      // TODO: Validation goes here

      var participants = this.$participants.val().split(/\s*,\s/g);

      this.model.set({
        title: this.$title.val(),
        from: this.$from.val(),
        to: this.$to.val(),
        location: this.$to.val(),
        description: this.$to.val(),
        participants: participants,
      });

      if (isNewEvent) {
        uiEventDispatch.trigger("newEventCreated", this.model);
      }

      this.$selectedTitle.text(this.model.get('title'));

      uiEventDispatch.trigger("eventsModified");
    });
  },
  render: function () {
    this.$selectedTitle.text(this.model.get('title'));
    this.$title.val(this.model.get('title'));
    this.$from.val(this.model.get('from'));
    this.$to.val(this.model.get('to'));
    this.$location.val(this.model.get('location'));
    this.$description.val(this.model.get('description'));

    var participants = this.model.get('participants').join(', ');
    this.$participants.val(participants);
  },
});

var LoadingView = Backbone.View.extend({
  initialize: function () {
    var view = this;

    view.$formElements = this.$el.find('input, button, .button, select');

    view.listenTo(uiEventDispatch, "startAsyncOp", function () {
      view.$formElements.attr('disabled', 'disabled');
    });

    view.listenTo(uiEventDispatch, "stopAsyncOp", function () {
      view.$formElements.removeAttr('disabled');
    });
  },
});

$(document).ready(function () {
  var $eventsForm = $('form[name="events"]');
  $eventsForm[0].reset();

  var searchQuery = new SearchQuery();
  var $searchQuery = $eventsForm.find('[name="searchQuery"]');
  var searchQueryView = new SearchQueryView({ model: searchQuery, el: $searchQuery });

  var events = new Events({ searchQuery: searchQuery });
  var eventSearch = new EventSearch({ model: events, el: $eventsForm });

  var currentEventView = new CurrentEventView({ el: $eventsForm });

  var $createUpdateEvent = $eventsForm.find('[name="createUpdate"]');
  var createUpdateEventView = new CreateUpdateEventView({ el: $createUpdateEvent });

  var $deleteEvent = $eventsForm.find('[name="delete"]');
  var deleteEventView = new DeleteEventView({ el: $deleteEvent });

  var loadingView = new LoadingView({ el: $eventsForm });

  events.fetch();
});
