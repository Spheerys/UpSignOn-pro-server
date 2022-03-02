import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';
import { checkBasicAuth } from '../helpers/authorizationChecks';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getContactsForSharedItem = async (req: any, res: any) => {
  // deprecated on 02/03/2022
  try {
    const itemId = req.body?.itemId;
    if (!itemId) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req, { checkIsRecipientForItemId: itemId });
    if (!basicAuth.granted) return res.status(401).end();

    const contactRes = await db.query(
      'SELECT users.id AS id, users.email AS email, sau.is_manager AS is_manager FROM users INNER JOIN shared_account_users AS sau ON sau.user_id=users.id WHERE sau.shared_account_id = $1 AND users.group_id=$2',
      [itemId, basicAuth.groupId],
    );
    // Return res
    return res
      .status(200)
      .json({ contacts: contactRes.rows.filter((c) => c.email !== basicAuth.userEmail) });
  } catch (e) {
    logError('getContactsForSharedItem', e);
    return res.status(400).end();
  }
};
