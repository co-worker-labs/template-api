import { Axios } from 'axios';
import { Logger } from '@nestjs/common';
import { genUUID } from './fns';

const logger = new Logger('Axios');

export function setupAxios(axios: Axios) {
  axios.interceptors.request.use(function (config) {
    const contentType = config.headers['Content-Type'];
    config['requestId'] = genUUID();

    const print_data =
      contentType && contentType.toString().indexOf('multipart/form-data') > -1;

    logger.log({
      name: 'AxiosReq',
      requestId: config['requestId'],
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: print_data ? config.data : 'no print',
      params: config.params,
    });

    return config;
  });

  axios.interceptors.response.use(
    function (response) {
      const requestId = response.config['requestId'];
      logger.log({
        name: 'AxiosRes',
        requestId,
        method: response.config.method,
        url: response.config.url,
        path: response.request?.path,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
      return response;
    },
    function (error) {
      let method = '';
      let url = '';
      let requestId = null;

      if (error.config) {
        method = error.config.method;
        url = error.config.url;
        requestId = error.config.requestId;
      }

      if (error.response) {
        const { status, data } = error.response;
        logger.error({
          name: 'AxiosError',
          requestId,
          method,
          url,
          status,
          message: error.message,
          data: data,
        });
      } else {
        logger.error({
          name: 'AxiosError',
          requestId,
          method,
          url,
          message: error.message,
          error,
        });
      }

      return Promise.reject(error);
    },
  );
}
