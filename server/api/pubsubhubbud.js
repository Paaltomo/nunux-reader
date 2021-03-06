require('date-utils');
var Feed   = require('../models/feed'),
    logger = require('../helpers').logger,
    async  = require('async');

module.exports = {
  /**
   * Update PubSubHubBud feed status.
   */
  callback: function(req, res, next) {
    var mode = req.query['hub.mode'];
    var topic = req.query['hub.topic'];
    var challenge = req.query['hub.challenge'];
    var lease = req.query['hub.lease_seconds'];
    var verifyToken = req.query['hub.verify_token'];
    var expires = new Date();
    if (lease && parseInt(lease, 10)) {
      expires.addSeconds(parseInt(lease, 10));
    }

    if (topic && ('subscribe' == mode || 'unsubscribe' == mode)) {
      logger.info('PubSubHubBud %s confirmation callback received for %s', mode, topic);
      async.waterfall(
        [
          function(callback) {
            Feed.getByUrl(topic, callback);
          },
          function(feed, callback) {
            Feed.update(feed, {
              pshbStatus: mode,
              expires: expires.toISOString()
            }, callback);
          },
          function() {
            res.send(challenge);
          }
        ],
        function(err) {
          logger.error('Error will updating PubSubHubBud status (%s) of topic %s: %s', mode, topic, err);
          next(err);
        }
      );
    } else {
      logger.info('Bad PubSubHubBud callback received %j', req.query);
      res.send(400);
    }
  },

  /**
   * Update PubSubHubBud feed status.
   */
  post: function(req, res, next) {
    Feed.updateArticles(req.rawBody, null, function(err) {
      if (err) {
        logger.error('PSHB REQUEST: %s', err);
      }
      res.send(200);
    });
  }
};
