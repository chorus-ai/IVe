import { configureStore, type Reducer } from '@reduxjs/toolkit'
import deepCopy from '../utils/deepcopy';
import { clearLocalStorage } from '../utils/localStorage';

// Every app under `apps/<name>/` may ship a Redux slice at `store/index.ts`
// Picked up automatically — no manual import needed when adding a new app.
const appStoreModules = import.meta.glob<Record<string, unknown>>('../apps/*/store/index.ts', { eager: true });

const appReducers: Record<string, Reducer> = {};
for (const [path, mod] of Object.entries(appStoreModules)) {
  const appName = path.match(/\.\.\/apps\/([^/]+)\/store\//)?.[1];
  const reducerKey = Object.keys(mod).find((key) => key.endsWith('Reducer'));
  if (!appName || !reducerKey) continue;
  appReducers[appName] = mod[reducerKey] as Reducer;
}

export interface FeatureUser {
  id: number;
  role: string;
  status?: string;
  featureId: number;
  userId: number;
}

export interface User {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  loginType?: string;
  avatar?: string | null;
  isBot?: boolean;
  featureUsers?: Record<string, FeatureUser> | FeatureUser[];
}

interface Feature {
  id: number;
  name: string;
  app?: string;
}

interface MainState {
  user: User | null | undefined;
  features?: Feature[];
}

interface MainAction {
  type: string;
  user?: User;
  features?: Feature[];
  value?: { avatar: string | null };
}

const mainReducer = (state: MainState = { user: null }, action: MainAction) => {
  switch (action.type) {
    case 'LOGIN': {
      return { ...state, user: action.user };
    }
    case 'LOGOUT': {
      clearLocalStorage(['apps-remember']);
      return { ...state, user: null };
    }
    case 'GET_FEATURES': {
      return { ...state, features: action.features };
    }
    case 'UPDATE_AVATAR': {
      const new_user = deepCopy(state.user) as User | null;
      if (new_user && action.value) new_user.avatar = action.value.avatar;
      return { ...state, user: new_user };
    }
    default:
      return state;
  }
};

const reducers: { main: typeof mainReducer } & Record<string, Reducer> = {
  main: mainReducer,
  ...appReducers,
};

export const store = configureStore({
  reducer: reducers,
  devTools: true,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch