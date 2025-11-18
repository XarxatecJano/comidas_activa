// Setup para tests de frontend

// Reset mocks antes de cada test
beforeEach(() => {
  // Mock de localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.localStorage = localStorageMock;

  // Mock de fetch
  global.fetch = jest.fn();

  // Mock de window.location
  delete window.location;
  window.location = {
    href: '',
    pathname: '',
    search: '',
    hash: '',
    hostname: 'localhost',
    reload: jest.fn(),
    replace: jest.fn(),
  };

  // Mock de alert, confirm, prompt
  global.alert = jest.fn();
  global.confirm = jest.fn();
  global.prompt = jest.fn();
  
  // Mock de window.print
  global.window.print = jest.fn();
});
