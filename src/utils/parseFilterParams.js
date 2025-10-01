function parseType(value) {
  if (typeof value === 'undefined') {
    return undefined;
  }

  const keys = ['work', 'home', 'personal'];
  if (keys.includes(value) !== true) {
    return undefined;
  }
  return value;
}

function parseIsFavourite(value) {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export function parseFilterParams(query) {
  const { contactType, isFavourite } = query;

  const parsedType = parseType(contactType);
  const parsedIsFavourite = parseIsFavourite(isFavourite);

  return {
    contactType: parsedType,
    isFavourite: parsedIsFavourite,
  };
}
