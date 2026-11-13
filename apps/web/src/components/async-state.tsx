export function LoadingState({label='Loading'}:{label?:string}){return <p role="status" className="state-message"><span className="spinner" aria-hidden="true"/>{label}</p>}
export function ErrorState({message='Something went wrong. Please try again.'}:{message?:string}){return <p role="alert" className="error-message">{message}</p>}
