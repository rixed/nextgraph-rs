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

use ng_repo::errors::ProtocolError;
use ng_repo::log::*;
use ng_repo::types::PubKey;

use super::super::StartProtocol;
use crate::broker::BROKER;
use crate::connection::NoiseFSM;
use crate::types::*;
use crate::{actor::*, types::ProtocolMessage};

/// Request usage statistics V0
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct RequestUsageStatsV0 {
    /// User pub key
    pub user: PubKey,
}

/// Request usage statistics of some given user
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub enum RequestUsageStats {
    V0(RequestUsageStatsV0),
}

impl RequestUsageStats {
    pub fn user(&self) -> PubKey {
        match self {
            RequestUsageStats::V0(o) => o.user,
        }
    }
    pub fn get_actor(&self) -> Box<dyn EActor> {
        Actor::<RequestUsageStats, AdminResponse>::new_responder(0)
    }
}

impl TryFrom<ProtocolMessage> for RequestUsageStats {
    type Error = ProtocolError;
    fn try_from(msg: ProtocolMessage) -> Result<Self, Self::Error> {
        if let ProtocolMessage::Start(StartProtocol::Admin(AdminRequest::V0(AdminRequestV0 {
            content: AdminRequestContentV0::RequestUsageStats(a),
            ..
        }))) = msg
        {
            Ok(a)
        } else {
            Err(ProtocolError::InvalidValue)
        }
    }
}

impl From<RequestUsageStats> for ProtocolMessage {
    fn from(_msg: RequestUsageStats) -> ProtocolMessage {
        unimplemented!();
    }
}

impl From<RequestUsageStats> for AdminRequestContentV0 {
    fn from(msg: RequestUsageStats) -> AdminRequestContentV0 {
        AdminRequestContentV0::RequestUsageStats(msg)
    }
}

impl Actor<'_, RequestUsageStats, AdminResponse> {}

#[async_trait::async_trait]
impl EActor for Actor<'_, RequestUsageStats, AdminResponse> {
    async fn respond(
        &mut self,
        msg: ProtocolMessage,
        fsm: Arc<Mutex<NoiseFSM>>,
    ) -> Result<(), ProtocolError> {
        log_debug!("EActor::usage_stats: starting");
        let req = RequestUsageStats::try_from(msg)?;
        let sb = { BROKER.read().await.get_server_broker()? };
        {
            let mut fsm = fsm.lock().await;
            let res = sb.read().await.usage_stats(&req.user());
            let response: AdminResponseV0 = res.into();
            fsm.send(response.into()).await?;
        }
        Ok(())
    }
}
