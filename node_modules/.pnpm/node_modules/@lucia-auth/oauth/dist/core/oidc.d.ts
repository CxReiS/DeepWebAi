export declare const decodeIdToken: <_Claims extends {}>(idToken: string) => {
    iss: string;
    aud: string;
    exp: number;
} & _Claims;
