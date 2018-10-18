//
// scorch.js - 1.0.0
//
// The MIT License (MIT)
//
// Copyright (c) 2018 David Vaccaro
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

	// The default constructor of all SMART Applications
	constructor() {
		this.launch = '';
		this.iss = '';
		this.parameters = {};
		this.patientid = '';
	}

	// Query String Parameter Parsing
	getParameter(name, url) {

		// Establish the url (use window.search if not supplied)
		if (url == null)
			url = window.location.search;

		// Return the requested part
		return (new URLSearchParams(url)).get(name);

	}

	// Initialize member functions
	initialize()
	{

		// Establish the SMART "launch" parameter value
		this.launch = this.getParameter('launch');

		// Establish the SMART "iss" parameter value
		this.iss = this.getParameter('iss');

		// Establish the SMART launch data
		this.parameters = JSON.parse(atob(this.launch));

		// Establish the SMART PatientID
		this.patientid = this.parameters.b;

	}

	// Start the application running
	start()
	{

		// Initialize the application
		application.initialize();

	}

}

// Handle the page-load
$(function() {

	// Start the application
	application.start();

});
