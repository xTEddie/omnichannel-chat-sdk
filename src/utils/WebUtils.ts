const loadScript = async (scriptUrl: string, callbackOnload: CallableFunction = () => void(0), callbackError: CallableFunction = () => void(0)): Promise<void> => {
  return new Promise (async (resolve, reject) => { // eslint-disable-line no-async-promise-executor
    const scriptElements = Array.from(document.getElementsByTagName('script'));
    const foundScriptElement = scriptElements.filter(scriptElement => scriptElement.src == scriptUrl);

    if (foundScriptElement.length) {
      await callbackOnload();
      return resolve();
    }

    const scriptElement = document.createElement('script');
    scriptElement.setAttribute('src', scriptUrl);
    scriptElement.setAttribute('type', 'text/javascript');
    document.head.appendChild(scriptElement);

    scriptElement.addEventListener('load', async () => {
      await callbackOnload();
      resolve();
    });

    scriptElement.addEventListener('error', async () => {
      await callbackError();
      reject();
    });
  });
};

const removeElementById = (id: string): void => {
  document.getElementById(id)?.remove();
}

const downloadJson = (jsonData: any, fileName = 'data.json'): void => {  // eslint-disable-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  const jsonDataPrefix = 'data:text/json;charset=utf-8'
  const data = `${jsonDataPrefix},${encodeURIComponent(JSON.stringify(jsonData))}`;
  const anchorElement = document.createElement('a');
  anchorElement.setAttribute("href", data);
  anchorElement.setAttribute("download", fileName);
  anchorElement.click();
}

export default {
  loadScript,
  removeElementById,
  downloadJson
}

export {
  loadScript,
  removeElementById,
  downloadJson
}