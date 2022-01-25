import { accessCodeHash } from '../helpers/accessCodeHash';
import { db } from '../helpers/connection';
import { isExpired } from '../helpers/dateHelper';
import { logError } from '../helpers/logger';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const checkDevice = async (req: any, res: any) => {
  try {
    const groupId = parseInt(req.params.groupId || 1);

    // Get params
    let userEmail = req.body?.userEmail;
    if (!userEmail || typeof userEmail !== 'string') return res.status(401).end();
    userEmail = userEmail.toLowerCase();

    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const deviceValidationCode = req.body?.deviceValidationCode;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!deviceValidationCode) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      'SELECT ' +
        'ud.id AS id, ' +
        'users.id AS user_id, ' +
        'ud.access_code_hash AS access_code_hash, ' +
        'ud.auth_code_expiration_date AS auth_code_expiration_date ' +
        'FROM user_devices AS ud ' +
        'INNER JOIN users ON ud.user_id = users.id ' +
        'WHERE ' +
        'users.email=$1 ' +
        'AND ud.device_unique_id = $2 ' +
        "AND ud.authorization_status = 'PENDING' " +
        'AND ud.authorization_code=$3 ' +
        'AND users.group_id=$4',
      [userEmail, deviceId, deviceValidationCode, groupId],
    );

    if (!dbRes || dbRes.rowCount === 0) {
      return res.status(401).end();
    }

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    if (isExpired(dbRes.rows[0].auth_code_expiration_date)) {
      return res.status(401).send({ expired: true });
    }

    await db.query(
      "UPDATE user_devices SET (authorization_status, authorization_code, auth_code_expiration_date) = ('AUTHORIZED', null, null) WHERE id=$1",
      [dbRes.rows[0].id],
    );
    return res.status(200).end();
  } catch (e) {
    logError('checkDevice', e);
    return res.status(400).end();
  }
};
