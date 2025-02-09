import { db } from '../helpers/db';
import { isExpired } from '../helpers/dateHelper';
import { logError } from '../helpers/logger';
import { checkDeviceRequestAuthorization, createDeviceChallenge } from '../helpers/deviceChallenge';
import { inputSanitizer } from '../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getPasswordBackup = async (req: any, res: any) => {
  try {
    const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

    // Get params
    const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
    if (!userEmail) return res.status(401).end();

    const deviceId = inputSanitizer.getString(req.body?.deviceId);
    const deviceAccessCode = inputSanitizer.getString(req.body?.deviceAccessCode); // DEPRECATED
    const deviceChallengeResponse = inputSanitizer.getString(req.body?.deviceChallengeResponse);
    const resetToken = inputSanitizer.getString(req.body?.resetToken);

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!resetToken) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        user_devices.id AS id,
        users.id AS userid,
        user_devices.access_code_hash AS access_code_hash,
        user_devices.encrypted_password_backup AS encrypted_password_backup,
        password_reset_request.id AS reset_request_id,
        password_reset_request.status AS reset_status,
        password_reset_request.reset_token AS reset_token,
        password_reset_request.reset_token_expiration_date AS reset_token_expiration_date,
        user_devices.device_public_key AS device_public_key,
        user_devices.session_auth_challenge AS session_auth_challenge,
        user_devices.session_auth_challenge_exp_time AS session_auth_challenge_exp_time
      FROM user_devices
        INNER JOIN users ON user_devices.user_id = users.id
        LEFT JOIN password_reset_request ON user_devices.id = password_reset_request.device_id
      WHERE
        users.email=$1
        AND user_devices.device_unique_id = $2
        AND user_devices.authorization_status='AUTHORIZED'
        AND user_devices.group_id=$3
      LIMIT 1`,
      [userEmail, deviceId, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();
    const resetRequest = dbRes.rows[0];

    if (!deviceAccessCode && !deviceChallengeResponse) {
      const deviceChallenge = await createDeviceChallenge(dbRes.rows[0].id);
      return res.status(403).json({ deviceChallenge });
    }
    const isDeviceAuthorized = await checkDeviceRequestAuthorization(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
      deviceChallengeResponse,
      dbRes.rows[0].id,
      dbRes.rows[0].session_auth_challenge_exp_time,
      dbRes.rows[0].session_auth_challenge,
      dbRes.rows[0].device_public_key,
    );
    if (!isDeviceAuthorized) return res.status(401).end();

    if (!resetRequest.reset_request_id) {
      return res.status(401).json({ error: 'no_request' });
    } else if (resetRequest.reset_token !== resetToken) {
      return res.status(401).json({ error: 'bad_token' });
    } else if (isExpired(resetRequest.reset_token_expiration_date)) {
      return res.status(401).json({ error: 'expired' });
    }

    await db.query(
      `DELETE FROM password_reset_request WHERE id='${resetRequest.reset_request_id}'`,
    );
    await db.query(
      'UPDATE user_devices SET password_challenge_error_count=0, password_challenge_blocked_until=null WHERE device_unique_id=$1 AND group_id=$2',
      [deviceId, groupId],
    );

    // Return res
    return res
      .status(200)
      .json({ encryptedPasswordBackup: resetRequest.encrypted_password_backup });
  } catch (e) {
    logError('getPasswordBackup', e);
    res.status(400).end();
  }
};
