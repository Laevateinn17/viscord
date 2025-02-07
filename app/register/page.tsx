"use client"

import Image from 'next/image'
import styles from './styles.module.css'
import TextInput from '@/components/text-input/text-input'
import TextLink from '@/components/text-link/text-link'
import PrimaryButton from "@/components/primary-button/primary-button"
import DateInput from "@/components/date-input/date-input"
import Checkbox from "@/components/checkbox/checkbox"
import { useState } from "react"

export default function Login() {
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    // const [dob, setDOB] = useState("");
    const [_, setSubscribe] = useState(false);

    return (
        <div className={styles.page}>
            <Image
                src='/logo.svg'
                alt='Discord'
                width={0}
                height={0}
                className={styles.logo} />
            <div className={styles["content-wrapper"]}>
                <div className={styles['content-container'] + " drop-shadow-xl"}>
                    <div className={styles['register-container']}>
                        <div className={styles['title-container']}>
                            <h1 className={"font-semibold text-2xl mb-2"}>Create an account</h1>
                        </div>
                        <div className={styles["login-form"]}>
                            <div className="mb-5 pt-1">
                                <TextInput label="Email" isRequired={true} value={email} onChange={(val) => setEmail(val)}/>
                            </div>
                            <div className="mb-5 pt-1">
                                <TextInput label="Display Name" 
                                value={displayName}
                                onChange={(val) => setDisplayName(val)}
                                helper="This is how other see you. You can use special characters and emoji."/>
                            </div>
                            <div className="mb-5 pt-1">
                                <TextInput label="Username" 
                                value={username}
                                onChange={(val) => setUsername(val)}
                                isRequired={true} 
                                helper="This can be used to log in."/>
                            </div>
                            <div className="mb-5 pt-1">
                                <TextInput label="Password" 
                                isRequired={true} 
                                type="password" 
                                value={password} 
                                onChange={setPassword}/>
                            </div>
                            <div className="pt-1 mb-4">
                                <DateInput label="Date of Birth" isRequired={true} />
                            </div>
                            <div className="mb-5">
                                <Checkbox
                                    value={true}
                                    onChange={(val) => setSubscribe(val)} >
                                    <p className={styles["subscribe-text"]}>(Optional) It&apos;s okay to send me emails with Discord updates, tips, and special offers. You can opt out at any time.</p>
                                </Checkbox>
                            </div>
                            <div className="">
                                <PrimaryButton text="Continue" />
                            </div>
                            <div className={styles["tos-text"]}>
                                <p>By registering, you agree to Discord&apos;s <TextLink text="Term of Service" fontSize={12} href="" /> and <TextLink fontSize={12} text="Privacy Policy" href="" /></p>
                            </div>
                            <div className={styles["login-text"]}>
                                <TextLink text="Already have an account?" href="/login" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}