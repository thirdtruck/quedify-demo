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
  initialize: function () {
    var events = this;

    events.listenTo(uiEventDispatch, "eventsModified", function () {
      events.sync("update", events);
    });
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
    var from = this.model.get("from");
    var to = this.model.get("to");

    var label = title + (_.isNull(from) ? "" : " " + from) + (_.isNull(to) ? "" : "-" + to);

    return label;
  }
});

var EventSearch = Backbone.View.extend({
  events: { },
  initialize: function () {
    this.$searchQuery = this.$el.find('[name="searchQuery"]');
    this.$searchResults = this.$el.find('[name="searchResults"]');
    this.listenTo(this.model, "change", this.render);
    this.listenTo(this.model, "add", this.render);
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
    this.$participants = this.$el.find('[name="participants"]');

    this.listenTo(uiEventDispatch, "eventSelected", function (evt) {
      this.model = evt;
      this.render();
    });

    this.listenTo(uiEventDispatch, "eventCreatedOrUpdated", function () {
      if (! this.model) { // e.g. before the user has selected their first event
        return;
      }

      var participants = this.$participants.val().split(/\s*,\s/g);

      this.model.set({
        title: this.$title.val(),
        from: this.$from.val(),
        to: this.$to.val(),
        location: this.$to.val(),
        participants: participants,
      });

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

    var participants = this.model.get('participants').join(', ');
    this.$participants.val(participants);
  },
});

$(document).ready(function () {
  var $eventsForm = $('form[name="events"]');
  $eventsForm[0].reset();

  var events = new Events();
  var eventSearch = new EventSearch({ model: events, el: $eventsForm });
  var currentEventView = new CurrentEventView({ el: $eventsForm });

  var $createUpdateEvent = $eventsForm.find('[name="createUpdate"]');
  var createUpdateEventView = new CreateUpdateEventView({ el: $createUpdateEvent });

  var $deleteEvent = $eventsForm.find('[name="delete"]');
  var deleteEventView = new DeleteEventView({ el: $deleteEvent });

  events.fetch();
});
