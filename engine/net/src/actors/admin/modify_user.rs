/*
 * Copyright (c) 2022-2025 Niko Bonnieure, Par le Peuple, NextGraph.org developers
 * All rights reserved.
 * Licensed under the Apache License, Version 2.0
 * <LICENSE-APACHE2 or http://www.apache.org/licenses/LICENSE-2.0>
 * or the MIT license <LICENSE-MIT or http://opensource.org/licenses/MIT>,
 * at your option. All files in the project carrying such
 * notice may not be copied, modified, or distributed except
 * according to those terms.
*/

use std::sync::Arc;

use async_std::sync::Mutex;
use serde::{Deserialize, Serialize};

use ng_repo::errors::*;
use ng_repo::types::PubKey;

use super::super::StartProtocol;

use crate::broker::BROKER;
use crate::connection::NoiseFSM;
use crate::types::*;
use crate::{actor::*, types::ProtocolMessage};

/// List users registered on this broker
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct ModifyUserV0 {
    pub user: PubKey,
    pub set_admin: bool,
}

/// Update the admin flag of some user
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub enum ModifyUser {
    V0(ModifyUserV0),
}

impl ModifyUser {
    pub fn user(&self) -> PubKey {
        match self {
            Self::V0(o) => o.user,
        }
    }
    pub fn set_admin(&self) -> bool {
        match self {
            Self::V0(o) => o.set_admin,
        }
    }
    pub fn get_actor(&self) -> Box<dyn EActor> {
        Actor::<ModifyUser, AdminResponse>::new_responder(0)
    }
}

impl TryFrom<ProtocolMessage> for ModifyUser {
    type Error = ProtocolError;
    fn try_from(msg: ProtocolMessage) -> Result<Self, Self::Error> {
        if let ProtocolMessage::Start(StartProtocol::Admin(AdminRequest::V0(AdminRequestV0 {
            content: AdminRequestContentV0::ModifyUser(a),
            ..
        }))) = msg
        {
            Ok(a)
        } else {
            //log_debug!("INVALID {:?}", msg);
            Err(ProtocolError::InvalidValue)
        }
    }
}

impl From<ModifyUser> for ProtocolMessage {
    fn from(_msg: ModifyUser) -> ProtocolMessage {
        unimplemented!();
    }
}

impl From<ModifyUser> for AdminRequestContentV0 {
    fn from(msg: ModifyUser) -> AdminRequestContentV0 {
        AdminRequestContentV0::ModifyUser(msg)
    }
}

impl Actor<'_, ModifyUser, AdminResponse> {}

#[async_trait::async_trait]
impl EActor for Actor<'_, ModifyUser, AdminResponse> {
    async fn respond(
        &mut self,
        msg: ProtocolMessage,
        fsm: Arc<Mutex<NoiseFSM>>,
    ) -> Result<(), ProtocolError> {
        let req = ModifyUser::try_from(msg)?;
        let sb = { BROKER.read().await.get_server_broker()? };
        let res = { sb.read().await.modify_user(req.user(), req.set_admin()) };

        let response: AdminResponseV0 = res.into();
        fsm.lock().await.send(response.into()).await?;
        Ok(())
    }
}
