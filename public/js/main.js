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
  optionLabel: function () {
    return this.get("title") + " " + this.get("from") + "-" + this.get("to");
  },
});

var Events = Backbone.Collection.extend({
  model: Event,
  url: '/events',
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
    var $options = this.model.map(function (evt) {
      var $option = $('<option value="' + evt.id + '">' + evt.optionLabel() + '</option>'); // TODO: Replace with safer templating
      return $option;
    });

    this.$searchResults.empty();
    this.$searchResults.append($options);
  },
});

$(document).ready(function () {
  var $eventsForm = $('form[name="events"]');

  var events = new Events();
  var eventSearch = new EventSearch({ model: events, el: $eventsForm });

  events.fetch();
});
