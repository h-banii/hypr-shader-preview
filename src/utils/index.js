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

export function createButton(container) {
  const element = document.createElement('button');
  if (container) container.appendChild(element);
  return element;
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
