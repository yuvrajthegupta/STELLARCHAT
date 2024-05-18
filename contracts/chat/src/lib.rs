#![no_std]
use soroban_sdk::{contract, contractimpl, Env, String,Address,Vec,contracttype,vec};

#[contracttype]
#[derive(Clone, Debug)]
pub struct Message {
    msg: String,
    from: Address,
}

type Conversation = Vec<Message>;

type ConversationsInitiated = Vec<Address>;

#[derive(Clone)]
#[contracttype]
pub struct ConversationsKey(pub Address, pub Address);

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Conversations(ConversationsKey),
    ConversationsInitiated(Address) // We add this line
}

pub fn update_conversations_initiated(env: &Env, from: Address, to: Address) {
    let mut conversations_initiated_from = env
        .storage()
        .instance()
        .get::<_, ConversationsInitiated>(&DataKey::ConversationsInitiated(from.clone()))
        .unwrap_or(vec![&env]);
    conversations_initiated_from.push_back(to.clone());
    env.storage().instance().set(
        &DataKey::ConversationsInitiated(from.clone()),
        &conversations_initiated_from);

    // If we are sending chat to ourselves, we don't want to have two different conversations
    if from != to {
        let mut conversations_initiated_to = env
            .storage()
            .instance()
            .get::<_, ConversationsInitiated>(&DataKey::ConversationsInitiated(to.clone()))
            .unwrap_or(vec![&env]);
        conversations_initiated_to.push_back(from.clone());
        env.storage().instance().set(
            &DataKey::ConversationsInitiated(to.clone()),
            &conversations_initiated_to,
        );
    }
}

#[contract]
pub struct ChatContract;

#[contractimpl]
impl ChatContract {

    // pub fn read_title(env: Env) -> String {
    //     String::from_str(&env, "This is a success")
    // }

    pub fn read_conversation(env: Env, from: Address, to: Address) -> Conversation {
        let key = DataKey::Conversations(ConversationsKey(from.clone(), to.clone()));
        let conversation = env
            .storage()
            .instance()
            .get::<_, Conversation>(&key)
            .unwrap_or(vec![&env]);
        conversation
    }

    pub fn read_conversations_initiated(env: Env, from: Address) -> ConversationsInitiated {
        let key = DataKey::ConversationsInitiated(from);
        let conversations_initiated = env
            .storage()
            .instance()
            .get::<_, ConversationsInitiated>(&key)
            .unwrap_or(vec![&env]);
        conversations_initiated
    }

    
    pub fn write_message(env: Env, from: Address, to: Address, msg_str: String) {
        // Ensure that the message sender is the from address
        from.require_auth();

        // First we need to retrieve the possibly already existing conversation between from and to
        let key = DataKey::Conversations(ConversationsKey(from.clone(), to.clone()));

        // We want to update the Conversation Initiated storage if it's the first time we have a conversation between from and to
        let conversation_exists =
            env.storage().instance().has(&key) && env.storage().instance().has(&key);
        if !conversation_exists {
            update_conversations_initiated(&env, from.clone(), to.clone())
        }

        // Then we can retrieve the conversation
        let mut conversation = env
            .storage()
            .instance()
            .get::<_, Conversation>(&key)
            .unwrap_or(vec![&env]);

        // Then we can add a new message to the conversation
        let new_message = Message {
            msg: msg_str,
            from: from.clone(),
        };
        conversation.push_back(new_message);

        // And we don't forget to set the state storage with the new value ON BOTH SIDES if not conversation to self
        env.storage().instance().set(&key, &conversation);
        if from != to {
            let key_other_side = DataKey::Conversations(ConversationsKey(to.clone(), from.clone()));
            env.storage()
                .instance()
                .set(&key_other_side, &conversation);
        }
    }
}

mod test;
