//
// scorch.js - 1.0.1
//
// The MIT License (MIT)
//
// Copyright (c) 2020 David Vaccaro
//
// https://github.com/davidvaccaro/scorch.js
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

class SMARTApplication
{

    // General Support Functions
    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

	// The default constructor of all SMART Applications
	constructor() {
        this.code = '';
        this.state = '';
        this.context = undefined;
        this.token = '';
        this.patient = undefined;
	}

	// Query String Parameter Parsing
	getParameter(name, url) {

		// Establish the url (use window.search if not supplied)
		if (url == null)
			url = window.location.search;

		// Return the requested part
		return (new URLSearchParams(url)).get(name);

	}

    // Establish the launch-context
    establishLaunchContext(launch, iss) {

        // Establish that
        var that = this;

        // Create the context
        this.context = {
            id: this.uuidv4(),
            scope: null,
            clientId: null,
            clientSecret: null,
            launch: launch,
            iss: iss,
            authorizeEndpoint: null,
            tokenEndpoint: null,
            redirectUri: null,
            failureUri: null
        };

        // Fetch the SMART app configuration
        $.ajax({
            type: "GET",
            dataType: "json",
            url: location.protocol + "//" + location.host + location.pathname.replace("/launch.html", "/config.json"),
            async: false,
            success: function(data) {

                // Set the SMART app configuration values
                that.context.scope = data.scope;
                that.context.clientId = data.clientId;
                that.context.clientSecret = data.clientSecret;
                that.context.redirectUri = location.protocol + "//" + location.host + location.pathname.replace("/launch.html", data.redirect)
                that.context.failureUri = location.protocol + "//" + location.host + location.pathname.replace("/launch.html", data.failure)

            }
        });

        // Fetch the FHIR conformance metadata
        $.ajax({
            type: "GET",
            dataType: "json",
            url: iss + "/metadata",
            async: false,
            success: function(data) {

                // If there are "rest" items
                if (data.rest.length > 0) {

                    // Loop over the "rest" items
                    for (var i = 0; i < data.rest.length; i++) {

                        // Parse the rest item
                        var rest = data.rest[i];

                        // If there are extensions
                        if (rest.security.extension.length > 0) {

                            // Loop over the extensions
                            for (var x = 0; x < rest.security.extension.length; x++) {

                                // Parse the extension item
                                var extension1 = rest.security.extension[x];

                                // If there are extensions
                                if (extension1.extension.length > 0) {

                                    // Loop over the extensions
                                    for (var y = 0; y < extension1.extension.length; y++) {

                                        // Parse the extension item
                                        var extension2 = extension1.extension[y];

                                        // Parse the "authorize" and "token" endpoints
                                        if (extension2.url == "authorize")
                                            that.context.authorizeEndpoint = extension2.valueUri;
                                        else if (extension2.url == "token")
                                            that.context.tokenEndpoint = extension2.valueUri;

                                    }

                                }

                            }

                        }

                    }

                }

            }
        });

        return this.context;

    }

    // Establish the launch-context
    establishRedirectContext(state) {

        // Establish that
        var that = this;

		// Decode the "state"
		state = JSON.parse(atob(state))

		// Create the context
        this.context = {
            id: state.id,
            scope: null,
            clientId: null,
            clientSecret: null,
            iss: state.iss,
            tokenEndpoint: state.tokenEndpoint
        };

        // Fetch the SMART app configuration
        $.ajax({
            type: "GET",
            dataType: "json",
            url: location.protocol + "//" + location.host + location.pathname.replace("/smart.html", "/config.json"),
            async: false,
            success: function(data) {

                // Set the SMART app configuration values
                that.context.scope = data.scope;
                that.context.clientId = data.clientId;
                that.context.clientSecret = data.clientSecret;
                that.context.redirectUri = location.protocol + "//" + location.host + location.pathname.replace("/launch.html", data.redirect)
                that.context.failureUri = location.protocol + "//" + location.host + location.pathname.replace("/launch.html", data.failure)

            }
        });

        return this.context;

    }

	// Handle the SMART application launch
	onLaunch()
	{

        // Establish the launch context
		this.context = this.establishLaunchContext(
            this.getParameter('launch'),
            this.getParameter('iss'));

        // Establish the state
        var state = btoa(JSON.stringify({
			id: this.context.id,
			iss: this.context.iss,
			tokenEndpoint: this.context.tokenEndpoint
		}));

        // Redirect to to the authorize endpoint
        window.location = this.context.authorizeEndpoint
            + "?response_type=code"
            + "&client_id=" + this.context.clientId
            + "&redirect_uri=" + this.context.redirectUri
            + "&launch=" + this.context.launch
            + "&scope=" + this.context.scope
            + "&state=" + state
            + "&aud=" + this.context.iss;

	}

    // Handle the SMART application redirect
    onRedirect()
    {

        // Set the that
        var that = this;

		// Establish the SMART "code" parameter value
		this.code = this.getParameter('code');

		// Establish the SMART "state" parameter value
		this.state = this.getParameter('state');

        // Re-establish the context
		this.context = this.establishLaunchContext(this.state);

        // Request the "token"
        $.ajax({
            type: "POST",
            url: this.context.tokenEndpoint,
            contentType: "application/x-www-form-urlencoded",
            dataType: "json",
            data: {
                grant_type: "authorization_code",
                code: this.code,
                redirect_uri: this.context.redirectUri,
                client_id: this.context.clientId
            },
            beforeSend: function(request) {
                request.setRequestHeader("Authorization", "Basic " + btoa(that.context.clientId + ":" + that.context.clientSecret));
            },
            success: function(data) {

                // Set the token
                that.token = data;

                // Call the start handler
                that.onStart(that.token);

            },
            failure: function(errMsg) {

                // Call hte error handler
                that.onError();

            }
        });

    }

	// Start the application running
	onStart(token)
	{

	    // Establish "that"
	    var that = this;

        // Set the token
        this.token = token;

		// Hide the "wait"
		$('#wait').hide();

	    // Load the patient resource
		$.ajax({
		    type: "GET",
		    url: this.context.iss + "/Patient/" + this.token.patient,
		    contentType: "application/x-www-form-urlencoded",
		    dataType: "json",
		    beforeSend: function(request) {
		        request.setRequestHeader("Authorization", "Bearer " + that.token.access_token);
		    },
		    success: function(data) {

		        // Set the patient resource
		        that.patient = data;

		    },
		    failure: function(errMsg) {

		        // Set the patient to undefined
		        that.patient = undefined;

		    }
		});

	}

    onError() {

		// Hide the "wait"
		$('#wait').hide();

        // Redirect to the error page
        window.location = this.context.failureUri;

    }

}

// Create the SMART Application
let application = new SMARTApplication();

// Handle the page-load
$(function() {

	setTimeout(() => {

		// Start the "wait"
		$('#wait').show();

		// Handle the action based on the page path ("launch" versus "redirect")
		if (window.location.pathname.includes("launch"))
			application.onLaunch();
		else
			application.onRedirect();


	}, 5000);

});
