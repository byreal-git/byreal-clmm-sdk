import ky, { Input, Options, KyInstance } from 'ky';

export class RequestError extends Error {
  code?: number;
  url?: string;
  constructor(message: string, code?: number, url?: string) {
    super(message);
    this.code = code;
    this.url = url;
  }
}

function handleResponseData(data: any, url?: string) {
  const retCode = data?.ret_code ?? data?.retCode;
  if (retCode === 0) {
    return {
      // FIXME temporary adaptation for swap, will be modified later
      data: data.result.data || data.result,
      retCode: data.result.code || retCode,
      retMsg: data.result.msg,
      // FIXME temporary adaptation for swap, will be modified later
      success: data.result.success || true,
    };
  } else {
    throw new RequestError(data?.ret_msg || data?.retMsg || 'Unknown error', data?.ret_code || data?.retCode, url);
  }
}

export interface IApiInstanceResp<T> {
  data: T;
  retCode: number;
  retMsg: string;
  success: boolean;
}

export type ApiInstance = {
  get<T>(input: Input, options?: Options & { params?: Record<string, any> }): Promise<IApiInstanceResp<T>>;
  post<T>(input: Input, options?: Options): Promise<IApiInstanceResp<T>>;
  put<T>(input: Input, options?: Options): Promise<IApiInstanceResp<T>>;
  delete<T>(input: Input, options?: Options): Promise<IApiInstanceResp<T>>;
  _kyInstance: KyInstance;
  _ky: KyInstance;
};

/**
 * 
 * // GET
const { data } = await api.get('your/path', { searchParams: { foo: 1 } });

// POST
const { data } = await api.post('your/path', { json: { foo: 1 } });

// PUT
const { data } = await api.put('your/path', { json: { foo: 1 } });

// DELETE
const { data } = await api.delete('your/path');
 * 
 * @param baseURL 
 * @param timeout 
 * @returns 
 */
export function createApiInstance(baseURL: string, timeout = 10000): ApiInstance {
  const kyInstance = ky.create({
    prefixUrl: baseURL,
    timeout,
    hooks: {
      afterResponse: [
        async (_request, _options, response) => {
          const data = await response.clone().json();
          const resp = handleResponseData(data, response.url);
          // Key: wrap into Response object
          return new Response(JSON.stringify(resp), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        },
      ],
    },
  });

  // Common request method
  async function request<T>(input: Input, options?: Options): Promise<IApiInstanceResp<T>> {
    const result = await kyInstance(input, options).json<IApiInstanceResp<T>>();
    return result;
  }

  return {
    get: <T>(input: Input, options?: Options & { params?: Record<string, any> }) => {
      let finalOptions = { method: 'get', ...options } as Options;
      if (options?.params) {
        finalOptions = {
          ...finalOptions,
          searchParams: options.params,
        };
        delete (finalOptions as any).params;
      }
      return request<T>(input, finalOptions);
    },
    post: <T>(input: Input, options?: Options) => request<T>(input, { method: 'post', ...options }),
    put: <T>(input: Input, options?: Options) => request<T>(input, { method: 'put', ...options }),
    delete: <T>(input: Input, options?: Options) => request<T>(input, { method: 'delete', ...options }),
    _kyInstance: kyInstance,
    _ky: ky,
  };
}
