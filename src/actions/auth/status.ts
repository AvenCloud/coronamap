import { User } from 'firebase';
import { AsyncStorage } from 'react-native';
import * as API from '../../api';
import { AuthStatusActionCreator, Dispatch, ActionType } from '..';
import { AuthStatus } from '../../data-types';
import { pullUserInfoFromLocalDBToRedux } from '../helpers';
import { downloadUserInfoToLocalDB } from './userInfo';

const setAuthStatusToSignedIn: AuthStatusActionCreator = userInfo => ({
  type: ActionType.SET_AUTH_STATUS,
  payload: { status: AuthStatus.SignedIn, userInfo },
});

const setAuthStatusToSignedOut: AuthStatusActionCreator = () => ({
  type: ActionType.SET_AUTH_STATUS,
  payload: { status: AuthStatus.SignedOut },
});

export const subscribeToAuthStateChange = () => (dispatch: Dispatch) => {
  API.initialize();

  return API.requestAuthStateListener((async (user: User) => {
    if (!user) {
      // Case 1: Signed out
      await Promise.all([
        AsyncStorage.removeItem('wellbeing'),
        AsyncStorage.removeItem('locationLastUpdatedAt'),
        AsyncStorage.removeItem('lastMapCenter'),
      ]);

      return dispatch(setAuthStatusToSignedOut());
    }

    // Case 2: Signed in
    const userInfo = {
      email: user.email,
      uid: user.uid,
      isEmailVerified: user.emailVerified,
    };

    await downloadUserInfoToLocalDB(user.uid);
    await pullUserInfoFromLocalDBToRedux(dispatch);
    return dispatch(setAuthStatusToSignedIn(userInfo));
  }) as any); // FIXME
};
