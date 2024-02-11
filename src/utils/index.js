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

export function queryParameters(func, parameters, url = new URL(window.location.href)) {
  for (const key in parameters) {
    parameters[key] = url.searchParams.get(key) || parameters[key];
  }

  func(parameters)
}
