/* eslint-disable */
const { useContext } = React;

const ConfigContext = React.createContext({
  baseUrl: '..',
  apiVersion: 32
});

const useConfig = () => useContext(ConfigContext);

const makeContext = config => config;

const ConfigProvider = ({
  config,
  children
}) => /*#__PURE__*/React.createElement(ConfigContext.Provider, {
  value: makeContext(config)
}, children);

export { ConfigProvider, useConfig };
//# sourceMappingURL=lib.js.map