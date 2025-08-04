import type { Auth } from "lucia";
export type LuciaUser<_Auth extends Auth> = ReturnType<_Auth["transformDatabaseUser"]>;
export type LuciaDatabaseUserAttributes<_Auth extends Auth> = Parameters<_Auth["createUser"]>[0]["attributes"];
