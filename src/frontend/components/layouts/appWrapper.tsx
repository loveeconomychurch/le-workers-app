/* eslint-disable react-hooks/exhaustive-deps */
import Head from 'next/head'
import {  Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react'
import { Box, Flex, Icon, Text} from '@chakra-ui/react'
import { NextRouter, useRouter } from 'next/router';
import { IAccountUser, getUser, removeSession, saveBusUser } from '@/frontend/store/auth';
import Menu from '../Menu';
import { TbAlignRight, TbArrowBackUp, TbHistory, TbHomeDot, TbLayoutBottombarCollapseFilled, TbPower, TbUsersGroup } from 'react-icons/tb';
import PageWrapper from './pageWrapper';
import { GroupedUnits } from '../Accounts/busingLogin';
import { IBusGroups } from '@/interface/bus';
import { useBaseGetQuery } from '@/frontend/apis/base';

interface MenuItem {
  title: string;
  icon: any; // Replace 'IconType' with the actual type for icons
  fn: (() => void) | null; // Function or null
}

interface RoleMenu {
  [x:string]: MenuItem[];
}

const roleMenu = (router: NextRouter, showMenu: boolean, setShowMenu: Dispatch<SetStateAction<boolean>>): RoleMenu => {
    return {
        BUS_REP: [
            {title: "Home", icon: TbHomeDot, fn: () => router.push(`/bus/bus-rep`)},
            {title: "History", icon: TbHistory, fn: null},
            {title: "Role Selection", icon: TbArrowBackUp, fn: () => router.push(`/bus`)},
            {title: "Logout", icon: TbPower, fn: removeSession}
        ],
        BUS_HEAD: [
            {title: "Home", icon: TbHomeDot, fn: () => router.push(`/bus/bus-head`)},
            {title: "Add Zone", icon: TbLayoutBottombarCollapseFilled, fn: () => router.push(`/bus/bus-head/zones`)},
            {title: "Add Bus Rep", icon: TbUsersGroup, fn:  () => router.push(`/bus/bus-head/accounts`)},
            {title: "History", icon: TbHistory, fn:  ()=>{}},
            {title: "Role Selection", icon: TbArrowBackUp, fn: () => router.push(`/bus`)},
            {title: "Logout", icon: TbPower, fn: removeSession}
        ],
        SECTOR_HEAD: [
            {title: "Home", icon: TbHomeDot, fn: () => router.push(`/bus/sector-head`)},
            {title: "Events", icon: TbHistory, fn: () => router.push(`/bus/sector-head/event`)},
            {title: "Manage Branch", icon: TbLayoutBottombarCollapseFilled, fn: () => router.push(`/bus/sector-head/groups`)},
            {title: "Manage Bus Head", icon: TbUsersGroup, fn:  () => router.push(`/bus/sector-head/accounts`)},
            {title: "Role Selection", icon: TbArrowBackUp, fn: () => router.push(`/bus`)},
            {title: "Logout", icon: TbPower, fn: removeSession}
        ],
        OVERALL_HEAD: [
            {title: "Home", icon: TbHomeDot, fn: () => router.push(`/bus/overall-head`)},
            {title: "Manage Sectors", icon: TbLayoutBottombarCollapseFilled, fn: () => router.push(`/bus/overall-head/groups`)},
            {title: "Manage Sector Heads", icon: TbUsersGroup, fn:  () => router.push(`/bus/overall-head/accounts`)},
            {title: "History", icon: TbHistory, fn:  ()=>{}},
            {title: "Role Selection", icon: TbArrowBackUp, fn: () => router.push(`/bus`)},
            {title: "Logout", icon: TbPower, fn: removeSession}
        ]
    }
}


const AppWrapper = (
    {hideInfo, children}: 
    {hideInfo?: boolean; children: ReactNode}
) => {
    const router = useRouter()
    const [currentUser, setCurrentUser] = useState<IAccountUser>()
    const [showMenu, setShowMenu] = useState<boolean>(false)
    
    const {isLoading, data: treeData} = useBaseGetQuery<IBusGroups[]>(
        `bus-groups/tree`,
        {_id: currentUser?.currentRole?.groupId },
        {group: currentUser?.currentRole?.groupId },
        !!(['BUS_REP','BUS_HEAD', 'BUS_HEAD', 'SECTOR_HEAD', 'OVERALL_HEAD'].includes(currentUser?.currentRole?.groupType as string))
    )

    const showChurchUnit = (role: string) => {
        switch (role) {
             case 'BUS_REP': return (
                    currentUser?.bus?.['ZONE']?.name &&
                    <Flex fontWeight={600} color={"gray.600"}>
                        <Text color={"gray.500"}>{`${currentUser?.bus?.['BRANCH']?.name}, ${currentUser?.bus?.['ZONE']?.name}`}</Text>
                    </Flex>
                )

            case 'BUS_HEAD': return (
                    currentUser?.bus?.['BRANCH']?.name &&
                    <Flex fontWeight={600} color={"gray.600"}>
                        <Text color={"gray.500"}>{`${currentUser?.bus?.['SECTOR']?.name}, ${currentUser?.bus?.['BRANCH']?.name}`}</Text>
                    </Flex>
                )
            
            case 'SECTOR_HEAD': return (
                    currentUser?.bus?.['SECTOR']?.name &&
                    <Flex fontWeight={600} color={"gray.600"}>
                        <Text color={"gray.500"}>{`${currentUser?.bus?.['SECTOR']?.name}`}</Text>
                    </Flex>
                )

            case 'OVERALL_HEAD': return (
                    currentUser?.bus?.['SECTOR']?.name &&
                    <Flex fontWeight={600} color={"gray.600"}></Flex>
                )
        
            default:
                break;
        }
    }

    useEffect(() => {
        if(treeData?.data.length){
            const busTreeData = treeData?.data
            const bus = busTreeData.reduce((acc: GroupedUnits, cValue: IBusGroups) => {
                if(cValue){
                    acc[cValue.type] = {
                        id: cValue._id,
                        name: cValue.name
                    }
                }
                return acc
            }, {})
            const account = currentUser as IAccountUser


            saveBusUser({...account, bus})
            setCurrentUser({...account, bus})
        }
    }, [treeData])


    useEffect(() => {
        const user = getUser() as IAccountUser
        if(!user) router.push('/bus/login')
        setCurrentUser(user)
    }, [])
    
  return (
    <PageWrapper>
        <Box maxW={"500px"} w="100%"  h={"100vh"} position={"relative"}>
            <Menu 
                options={roleMenu(router, showMenu, setShowMenu)[currentUser?.currentRole?.groupType as string]} 
                show={showMenu}
                setShow={setShowMenu} 
            />
            <Box px={4}>
                {hideInfo ? null : <>
                    <Flex align={"center"} justify="space-between" bg="gray.100" py={4} px={2} mt={4} rounded={"md"}>
                        <Box>
                            {!isLoading && showChurchUnit(currentUser?.currentRole?.groupType as string)}
                            <Text fontWeight={600} fontSize={14} color="gray.400" textTransform={"capitalize"}>Hello {currentUser?.name}!</Text>
                        </Box>
                        <Flex onClick={() => setShowMenu(true)}>
                            <Icon as={TbAlignRight} color="gray.600" fontSize={28} mr={3} />
                        </Flex>
                    </Flex>
                </>}

                {children}
            </Box>
        </Box>
    </PageWrapper>
  )
}


export default AppWrapper
