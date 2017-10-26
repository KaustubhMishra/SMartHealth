export function authorsFormattedForDropdown(authors) {
  return authors.map(author => {
    return {
      value: author.id,
      text: author.firstName + ' ' + author.lastName
    };
  });
}

export function sponsorsFormattedForDropdown(sponsors) {
  return sponsors.map(sponsor => {
    return {
      value: sponsor.id,
      text: sponsor.contact_name
    };
  });
}

export function dsmbsFormattedForDropdown(dsmbs) {
  return dsmbs.map(dsmb => {
    return {
      value: dsmb.id,
      text: dsmb.firstname + ' ' + dsmb.lastname
    };
  });
}

export function drugTypesFormattedForDropdown(drugTypes) {
  return drugTypes.map(drugType => {
    return {
      value: drugType.id,
      text: drugType.name
    };
  });
}

export function dosagesFormattedForDropdown(dosages) {
  return dosages.map(dosage => {
    return {
      value: dosage.id,
      text: dosage.name
    };
  });
}

export function frequenciesFormattedForDropdown(frequencies) {
  return frequencies.map(frequency => {
    return {
      value: frequency.id,
      text: frequency.name
    };
  });
}

export function trialsFormattedForDropdown(trials) {
  return trials.map(trial => {
    return {
      value: trial.id,
      text: trial.name
    };
  });
}
export function phasesFormattedForDropdown(phases) {
  return phases.map(phase => {
    return {
      value: phase.id,
      text: phase.name
    };
  });
}
export function statusesFormattedForDropdown(statuses) {
  return statuses.map(status => {
    return {
      value: status.id,
      text: status.name
    };
  });
}
export function userRoleFormattedForDropdown(role) {
  return role.map(role => {
    return {
      value: role.id,
      text: role.name
    };
  });
}

export function timezoneFormattedForDropdown(timezone) {
  return timezone.map(timezone => {
    return {
      value: timezone,
      text: timezone
    };
  });
}

export function countryFormattedForDropdown(country) {
  return country.map(country => {
    return {
      value: country.id,
      text: country.name
    };
  });
}

export function stateFormattedForDropdown(state) {
  return state.map(state => {
    return {
      value: state.name,
      text: state.name
    };
  });
}

export function deviceGroupFormattedForDropdown(device) {
  return device.map(device => {
    return {
      value: device.id,
      text: device.name
    };
  });
}

export function sponsorDSMBFormattedForDropdown(sponsor) {
  return sponsor.map(sponsor => {
    return {
      value: sponsor.id,
      text: sponsor.contact_name
    };
  });
}

export function croCoordinatorFormattedForDropdown(croCoordinator) {
  return croCoordinator.map(croCoordinator => {
    return {
      value: croCoordinator.id,
      text: croCoordinator.firstname + ' ' + croCoordinator.lastname
    };
  });
}

export function genderFormattedForDropdown(patientGender) {
  return patientGender.map(patientGender => {
    return {
      value: patientGender,
      text: patientGender
    };
  });
}

export function trialFormattedForDropdown(trialData) {
  return trialData.map(trial => {
    return {
      value: trial.name,
      text: trial.name
    };
  });
}
