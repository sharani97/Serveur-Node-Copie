export const asyncMiddleware = fn =>
(req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch(next);
};


export function to<I>(promise:Promise<I>) {  
  return promise.then((data) => {
     return [null, data];
  })
  .catch(err => [err]);
}