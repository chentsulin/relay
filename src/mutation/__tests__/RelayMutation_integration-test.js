/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+relay
 */

'use strict';

require('configureForRelayOSS');

jest.autoMockOff();

const Relay = require('Relay');
const RelayEnvironment = require('RelayEnvironment');
const RelayMutation = require('RelayMutation');

describe('RelayMutation', () => {
  let bodyID;
  let environment;
  let feedbackID;
  let storeData;
  let query;

  beforeEach(() => {
    jest.resetModuleRegistry();

    environment = new RelayEnvironment();
    storeData = environment.getStoreData();
    feedbackID = '123';

    query = Relay.createQuery(
        Relay.QL`
        query CreateFeedbackQuery($id: ID!) {
          node(id: $id) {
            ... on Feedback {
              id
              doesViewerLike
              body {
                text
              }
            }
          }
        }
      `,
      {
        id: feedbackID,
      }
    );
    storeData.handleQueryPayload(
      query,
      {
        node: {
          id: feedbackID,
          __typename: 'Feedback',
          doesViewerLike: false,
          body: {
            text: 'Give Relay',
          },
        },
      }
    );
    bodyID = storeData.getCachedStore().getLinkedRecordID(feedbackID, 'body');
  });

  class FeedbackLikeMutation extends RelayMutation {
    getMutation() {
      return Relay.QL`mutation { feedbackLike }`;
    }
    getVariables() {
      return {
        feedbackId: this.props.feedbackID,
      };
    }
    getFatQuery() {
      return Relay.QL`
        fragment on FeedbackLikeResponsePayload @relay(pattern: true) {
          clientMutationId
          feedback {
            id
            doesViewerLike
            body {
              text
            }
          }
        }
      `;
    }
    getConfigs() {
      return [];
    }
    getOptimisticResponse() {
      const payload = {
        feedback: {
          id: this.props.feedbackID,
        },
      };
      if (this.props.doesViewerLike !== undefined) {
        payload.feedback.doesViewerLike = this.props.doesViewerLike;
      }
      if (this.props.text !== undefined) {
        payload.feedback.body = {
          text: this.props.text,
        };
      }
      return payload;
    }
  }

  it('starts with the story unliked', () => {
    const data = environment.readQuery(query)[0];
    expect(data).toEqual({
      __dataID__: feedbackID,
      id: feedbackID,
      doesViewerLike: false,
      body: {
        __dataID__: bodyID,
        text: 'Give Relay',
      },
    });
  });

  it('applies optimistic payloads', () => {
    const mutation = new FeedbackLikeMutation({
      feedbackID,
      doesViewerLike: true,
    });
    environment.applyUpdate(mutation);

    const data = environment.readQuery(query)[0];
    expect(data).toEqual({
      __dataID__: feedbackID,
      __mutationStatus__: '0:UNCOMMITTED',
      __status__: 1,
      id: feedbackID,
      doesViewerLike: true,
      body: {
        __dataID__: bodyID,
        text: 'Give Relay',
      },
    });
  });

  it('reverts optimistic payloads asynchronously', () => {
    const mutation = new FeedbackLikeMutation({
      feedbackID,
      doesViewerLike: true,
    });
    const transaction = environment.applyUpdate(mutation);
    transaction.rollback();

    let data = environment.readQuery(query)[0];
    expect(data).toEqual({
      __dataID__: feedbackID,
      // transaction already rolled back, no status to show:
      __mutationStatus__: '',
      // but optimistic data still applies:
      __status__: 1,
      id: feedbackID,
      doesViewerLike: true,
      body: {
        __dataID__: bodyID,
        text: 'Give Relay',
      },
    });

    jest.runAllTimers();
    data = environment.readQuery(query)[0];
    expect(data).toEqual({
      __dataID__: feedbackID,
      id: feedbackID,
      doesViewerLike: false,
      body: {
        __dataID__: bodyID,
        text: 'Give Relay',
      },
    });
  });

  it('reverts and applies optimistic payloads', () => {
    const mutation1 = new FeedbackLikeMutation({
      feedbackID,
      doesViewerLike: true,
    });
    const transaction1 = environment.applyUpdate(mutation1);
    transaction1.rollback();

    const mutation2 = new FeedbackLikeMutation({
      feedbackID,
      text: 'Gave Relay!',
    });
    environment.applyUpdate(mutation2);

    let data = environment.readQuery(query)[0];
    expect(data).toEqual({
      __dataID__: feedbackID,
      // first transaction rolled back so only second status appears
      __mutationStatus__: '1:UNCOMMITTED',
      // has optimistic data:
      __status__: 1,
      id: feedbackID,
      // first transaction's payload still applies
      doesViewerLike: true,
      body: {
        __dataID__: bodyID,
        __mutationStatus__: '1:UNCOMMITTED',
        __status__: 1,
        text: 'Gave Relay!',
      },
    });

    jest.runAllTimers();
    data = environment.readQuery(query)[0];
    expect(data).toEqual({
      __dataID__: feedbackID,
      __mutationStatus__: '1:UNCOMMITTED',
      __status__: 1,
      id: feedbackID,
      // first transaction's payload reverted
      doesViewerLike: false,
      body: {
        __dataID__: bodyID,
        __mutationStatus__: '1:UNCOMMITTED',
        __status__: 1,
        text: 'Gave Relay!',
      },
    });
  });
});

