//
// SMARTApp.DrugDrug.js
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

class SMARTDrugDrugApp extends SMARTApplication
{

	// Class Constructor
	constructor()
	{
		super();
	}

	// SMART App start handler
	start()
	{

		// Remeber "that"
		var that = this;

		// Call the base "start"
		super.start();

		// Start the "wait"
		$('#wait').show();

		// Load the medications
		that.queryMedications(function (medicationList) {

			// Load the drug-drug interactions
			that.populateDrugDrugInteractions(medicationList, function () {

				// Hide the "wait"
				$('#wait').hide();

			});

		});

	}

	queryMedications(done) {

		// Remeber "that"
		var that = this;

		// Search for active Prescriptions, including med details
		$.ajax({

			// Formulate the MedicationRequest Query URL
			url: that.iss + "/MedicationRequest?patient=" + that.patientid,

			// Handle the response
			success: function (response) {

				// The current list of the patient's perscription medications
				var medicationList = {};

				// Loop over the bundled resources
				$.each(response.entry, function (index, resourceEntries) {

					// If the resource is a "MedicationRequest"
					if ((resourceEntries.resource.resourceType == "MedicationRequest") && (resourceEntries.resource.medicationReference != null) && (resourceEntries.resource.medicationReference.reference != null)) {

						// Get the Medication details
						$.ajax({

							// Formulate the Medication Read URL
							url: that.iss + "/" + resourceEntries.resource.medicationReference.reference,

							// Make this call synchronously
							async: false,

							// Handle the response
							success: function (response) {

								// Populate the drug
								medicationList[response.code.coding[0].code] = response.code.coding[0].display;

							}

						});

					}

				});

				// Call the done handler
				if (done != null)
					done(medicationList);

			},

			// The fail handler
			fail: function () {

				// Call the done handler
				if (done != null)
					done(null);

			}

		});

	}

	populateDrugDrugInteractions(medicationList, done) {

		// Remeber "that"
		var that = this;

		// Check the params
		if ((medicationList == null) || (Object.keys(medicationList).length == 0))
		{

			// Add the row to the interaction table
			$('#interactions tbody').append('<tr><td>No drug interactions</td><td></td><td></td><td></td></tr>');

			// Call the done handler
			if (done != null)
				done();

			return;

		}

		// Request the drug-drug interaction data
		$.ajax({

			// Formulate the Drug-Drug Interaction Query URL
			url: "https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=" + Object.keys(medicationList).join('+'),

			// Handle the response
			success: function (response) {

				// If there were NO interactions, display the fact
				if ((response.fullInteractionTypeGroup == null) || (response.fullInteractionTypeGroup.length == 0)) {

					// Add the row to the interaction table
					$('#interactions tbody').append('<tr><td>No drug interactions</td><td></td><td></td><td></td></tr>');

				}
				else {

					// Loop over each of the interactions
					$.each(response.fullInteractionTypeGroup[0].fullInteractionType, function (index, value) {

						// Determine the name of the drugs (from the FHIR dataset)
						var drug1name = medicationList[value.minConcept[0].rxcui];
						var drug2name = medicationList[value.minConcept[1].rxcui];

						// Establish the interaction severity
						var interactionSeverity = value.interactionPair[0].severity;

						// Establish the interaction description
						var interactionDescription = value.interactionPair[0].description;

						// Add the row to the interaction table
						$('#interactions tbody').append('<tr><td>' + drug1name + '</td><td>' + drug2name + '</td><td>' + interactionSeverity + '</td><td>' + interactionDescription + '</td></tr>');

					});

				}

				// Call the success handler
				if (done != null)
					done();

			},

			// The fail handler
			fail: function () {

				// Call the done handler
				if (done != null)
					done();

			}

		});

	}

}

// Create the SMART Application
let application = new SMARTDrugDrugApp();

