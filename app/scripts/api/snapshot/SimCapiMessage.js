/**
 * @license
 * Adaptive E-Learning Sim Control API (CAPI).
 *
 * Copyright 2011 Smart Sparrow Pty. Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(function(require) {

    var SimCapiMessage = function(params) {

        // Ensure that params is initialized. This is just making code cleaner by avoiding lots of
        // null checks
        params = params || {};

        // The message type. Select from TYPES.
        this.type = params.type || null;

        /*
         * This is needed to create a handshake between stage and iframe. Without a handshake,
         * we can't identify the IFrame from which a message was sent.
         */
        this.handshake = params.handshake || {
            requestToken: null,
            authToken: null
        };

        /*
         * Values is a map containing (key, CapiValue) pairs.
         */
        this.values = params.values || {};

        /*
         * Optional options object to be passed to the viewer
         */
        this.options = params.options || {};
    };

    /*
     * Define message type enums as a class variable.
     * Next number is 23
     */
    SimCapiMessage.TYPES = {
        HANDSHAKE_REQUEST: 1,
        HANDSHAKE_RESPONSE: 2,
        ON_READY: 3,
        VALUE_CHANGE: 4,
        CONFIG_CHANGE: 5,
        VALUE_CHANGE_REQUEST: 6,
        CHECK_REQUEST: 7,
        CHECK_COMPLETE_RESPONSE: 8,
        GET_DATA_REQUEST: 9,
        GET_DATA_RESPONSE: 10,
        SET_DATA_REQUEST: 11,
        SET_DATA_RESPONSE: 12,
        INITIAL_SETUP_COMPLETE: 14,
        CHECK_START_RESPONSE: 15,
        API_CALL_REQUEST: 16,
        API_CALL_RESPONSE: 17,
        RESIZE_PARENT_CONTAINER_REQUEST: 18,
        RESIZE_PARENT_CONTAINER_RESPONSE: 19,
        ALLOW_INTERNAL_ACCESS: 20,
        REGISTER_LOCAL_DATA_CHANGE_LISTENER: 21,
        REGISTERED_LOCAL_DATA_CHANGED: 22
    };

    return SimCapiMessage;
});
