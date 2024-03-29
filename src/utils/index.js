export function *doubleClick(one, two, interval) {
  let timeoutId, previousClickDate = 0;

  while (true) {
    const now = Date.now();

    if (now - previousClickDate > interval) {
      timeoutId = setTimeout(one, interval);
      previousClickDate = now;
    } else {
      clearTimeout(timeoutId);
      previousClickDate = 0;
      two();
    }

    yield;
  }
}

function convert(type, value) {
  switch(type) {
    case 'boolean':
      return value == 'true';
    case 'number':
      return Number(value);
  }
  return value;
}

export function queryParameters(func, parameters, url = new URL(window.location.href)) {
  for (const key in parameters) {
    parameters[key] = convert(typeof parameters[key], url.searchParams.get(key)) || parameters[key];
  }

  func(parameters)
}

export const generateFilename = function(prefix, ...parameters) {
  const regex = /\..+/g;
  let filename = prefix;
  for (const params of parameters) {
    filename += `-${params.replace(regex, '')}`;
  }
  return filename;
}

export function createElement({ type = 'div', children = [], setup = () => {}, ...rest }) {
  const element = document.createElement(type);

  for (const parameter in rest) {
    element[parameter] = rest[parameter];
  }

  for (const child of children) {
    element.append(child);
  }

  setup(element);

  return element;
}

export function createInput({ type = 'text', ...rest }) {
  const element = createElement({ type: 'input', ...rest });

  element.type = type;

  return element;
}

/**
 * Immediately does the requested action then waits a certain delay before
 * acepting any new requests.
 */
export function holdup(delay = 1000) {
  const hold = (function*() {
    let time = null;
    while (true) {
      const action = yield;
      if (!action) continue;

      const now = new Date;
      if (!!time && now - time < delay) continue;
      time = now;

      action();
    }
  })();
  hold.next();
  return hold;
}
