/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from 'react'
import { Box, Flex, Icon, Skeleton, Text } from '@chakra-ui/react'
import { IAccountUser, getUser } from '@/frontend/store/auth'
import { useRouter } from 'next/router'
import { TbChevronLeft } from 'react-icons/tb'
import { useBasePostQuery } from '@/frontend/apis/base'
import GuardWrapper from '@/frontend/components/layouts/guardWrapper'
import AppWrapper from '@/frontend/components/layouts/appWrapper'
import { getSpecificBusData } from '@/frontend/store/bus'

export interface IEventData {
  id: string
  name: string
  start: string
  end: string
  timeSince: string
  live: boolean
}

export default function SectorHeadEventSummary() {
  const [currentUser, setCurrentUser] = useState<IAccountUser>()
  const [eventData, setEventData] = useState<IEventData>()
  const router = useRouter()

  // Summary stats for this sector (people, buses, finance)
  const { isLoading, data } = useBasePostQuery<{
    busInfo: { total_buses: number; arrived: number; on_route: number }
    peopleInfo: { people: number; arrived: number; on_route: number }
    financeInfo: { offering: number; cost: number }
    notStarted: string[]
    unMetTarget: string[]
  }>(
    'bus-rounds/overall-sector',
    { ...eventData, group: currentUser?.currentRole?.groupId },
    { ...eventData, group: currentUser?.currentRole?.groupId },
    !!(currentUser && eventData?.id)
  )

  // Branches (bus heads) within this sector
  const { isLoading: branchesLoading, data: branchesData } = useBasePostQuery<any[]>(
    'bus-rounds/sector',
    { ...eventData, group: currentUser?.currentRole?.groupId },
    { ...eventData, group: currentUser?.currentRole?.groupId },
    !!(currentUser && eventData?.id)
  )

  useEffect(() => {
    const user = getUser() as IAccountUser
    if (!user) router.push('/bus/login')
    setCurrentUser(user)

    const saved = getSpecificBusData<IEventData>('selected-event')
    setEventData(saved)
  }, [])

  const getPercentage = useMemo(() => {
    const total = data?.data?.busInfo?.total_buses || 0
    const unmet = data?.data?.unMetTarget?.length || 0
    return total === 0 ? 0 : ((total - unmet) / total) * 100
  }, [data?.data])

  return (
    <GuardWrapper allowed={['SECTOR_HEAD']} redirectTo='/bus/login' app='bus'>
      <AppWrapper>
        <Flex gap={4} mt={4}>
          <Flex
            px={3} py={4} align={'center'} rounded={'md'}
            bg="gray.200" h={14} cursor={'pointer'}
            onClick={() => router.back()}
          >
            <Icon as={TbChevronLeft} fontSize={32} color={'gray.500'} />
          </Flex>
          <Box textAlign={'center'} p={4} bg="gray.400" rounded={'md'} color="white" mb={4} w="100%" h={14}>
            Event Summary
          </Box>
        </Flex>

        <Flex mt={2} align={'center'} justify={'space-between'}>
          <Text fontWeight={600} color="gray.500">{eventData?.name}</Text>
        </Flex>

        <Box maxH={'calc(100vh - 230px)'} overflowY={'scroll'}>
          {isLoading ? (
            <Flex gap={4}>
              <Skeleton h={40} rounded="md" flex={1} />
              <Skeleton h={40} rounded="md" flex={1} />
            </Flex>
          ) : (
            <Box>
              <Box mt={4}>
                <Flex gap={3}>
                  {/* People card */}
                  <Box bg="blue.100" p={4} rounded={'md'} flex={6}>
                    <Box borderColor={'blue.200'} borderBottomWidth={1} color={'blue.400'}>People</Box>
                    <Flex align={'baseline'} color={'blue.500'} gap={2}>
                      <Text fontSize={32} fontWeight={700}>{data?.data?.peopleInfo?.arrived || 0}</Text>
                      <Text>people arrived</Text>
                    </Flex>
                    <Flex align={'baseline'} color={'blue.400'} gap={2}>
                      <Text fontWeight={600}>{data?.data?.peopleInfo?.on_route || 0}</Text>
                      <Text>en route</Text>
                    </Flex>
                  </Box>

                  {/* Bus card */}
                  <Box bg="blue.100" p={4} rounded={'md'} flex={6}>
                    <Box borderColor={'blue.200'} borderBottomWidth={1} color={'blue.400'}>Bus</Box>
                    <Flex align={'baseline'} color={'blue.500'} gap={2}>
                      <Text fontSize={32} fontWeight={700}>{data?.data?.busInfo?.arrived || 0}</Text>
                      <Text>buses arrived</Text>
                    </Flex>
                    <Flex align={'baseline'} color={'blue.400'} gap={2}>
                      <Text fontWeight={600}>{data?.data?.busInfo?.on_route || 0}</Text>
                      <Text>en route</Text>
                    </Flex>
                  </Box>
                </Flex>

                <Flex gap={3} mt={3}>
                  {/* Finance card */}
                  <Box bg="gray.100" p={4} rounded={'md'} flex={7}>
                    <Text color={'gray.400'}>Financial</Text>
                    <hr />
                    <Flex align={'baseline'} color={'gray.500'} gap={2}>
                      <Text fontWeight={700}>Ghc</Text>
                      <Text fontSize={28} fontWeight={600}>{data?.data?.financeInfo?.cost || 0}</Text>
                      <Text>total cost</Text>
                    </Flex>
                    <Flex align={'baseline'} color={'gray.400'} gap={2}>
                      <Text fontWeight={600}>Ghc {data?.data?.financeInfo?.offering || 0}</Text>
                      <Text>offering</Text>
                    </Flex>
                  </Box>

                  {/* Target card */}
                  <Box bg="gray.100" p={4} rounded={'md'} flex={7}>
                    <Text color={'gray.400'}>Target</Text>
                    <hr />
                    <Flex align={'baseline'} color={'gray.500'} gap={2}>
                      <Text fontSize={32} fontWeight={600}>
                        {isNaN(getPercentage) ? 0 : getPercentage.toFixed(0)}%
                      </Text>
                    </Flex>
                    <Text color={'gray.400'} fontSize={13}>
                      {(data?.data?.busInfo?.total_buses || 0) - (data?.data?.unMetTarget?.length || 0)} of {data?.data?.busInfo?.total_buses || 0} buses met target
                    </Text>
                  </Box>
                </Flex>
              </Box>

              {/* Bus head performance warning */}
              {(data?.data?.notStarted?.length || 0) > 0 && (
                <Box rounded={'md'} bg="red.100" borderWidth={2} borderColor={'red.200'} p={3} mt={4}>
                  <Text color={'red.400'} fontWeight={600}>
                    {data?.data?.notStarted?.length} branch(es) have no bus activity yet
                  </Text>
                </Box>
              )}
            </Box>
          )}

          {/* Branches list */}
          <Box mt={6}>
            <Text color={'gray.500'} fontWeight={600} fontSize={20}>Branches</Text>

            {branchesLoading ? (
              <Flex direction={'column'}>
                <Skeleton h={24} w="100%" mb={3} />
                <Skeleton h={24} w="100%" mb={3} />
                <Skeleton h={24} w="100%" mb={3} />
              </Flex>
            ) : null}

            {branchesData?.data.map((item: any) => (
              <Box key={item.id} rounded={'md'} borderWidth={1} bg={'gray.100'} p={4} mb={4}>
                <Flex justify={'space-between'}>
                  <Text color={'gray.500'}>{item.name}</Text>
                  <Text color={'gray.500'}>
                    <Text as={'span'} fontWeight={600}>
                      {(item?.records?.busArrived || 0) + (item?.records?.busInRoute || 0)}
                    </Text>{' '}Buses
                  </Text>
                </Flex>
                <Flex gap={2} wrap={'wrap'} mt={1}>
                  {item?.children?.map((k: any) => (
                    <Box
                      key={k?._id || k}
                      bg={k.bused ? 'blue.300' : 'gray.400'}
                      color={'white'}
                      px={3}
                      rounded={'md'}
                      fontSize={15}
                    >
                      {k?.name}
                    </Box>
                  ))}
                </Flex>
                <Flex justify={'space-between'} borderTopWidth={1} borderBottomWidth={1} borderColor={'gray.300'} mt={2} mb={4} py={3}>
                  <Box>
                    <Text fontWeight={600} fontSize={14} color={'gray.400'}>Bus Activity</Text>
                    <Box mt={1} color={'gray.600'}>
                      <Flex gap={2}>
                        <Text>Arrived</Text>
                        <Text fontWeight={600}>{item?.records?.busArrived || 0}</Text>
                      </Flex>
                      <Flex gap={2}>
                        <Text>En Route</Text>
                        <Text fontWeight={600}>{item?.records?.busInRoute || 0}</Text>
                      </Flex>
                    </Box>
                  </Box>
                  <Box>
                    <Text fontWeight={600} fontSize={14} color={'gray.400'}>People Transported</Text>
                    <Box mt={1} color={'gray.600'}>
                      <Flex gap={2}>
                        <Text>Arrived</Text>
                        <Text fontWeight={600}>{item?.records?.peopleArrived || 0}</Text>
                      </Flex>
                      <Flex gap={2}>
                        <Text>En Route</Text>
                        <Text fontWeight={600}>{item?.records?.peopleInRoute || 0}</Text>
                      </Flex>
                    </Box>
                  </Box>
                </Flex>
                <Flex justify={'space-between'} mt={2} color={'gray.500'}>
                  <Text>Ghc <Text as={'span'} fontWeight={600}>{item?.records?.offering || 0}</Text> offering</Text>
                  <Text>Ghc <Text as={'span'} fontWeight={600}>{item?.records?.cost || 0}</Text> bus cost</Text>
                </Flex>
              </Box>
            ))}

            {!branchesLoading && branchesData?.data.length === 0 && (
              <Text color={'gray.400'} textAlign={'center'} mt={4}>No branch data for this event</Text>
            )}
          </Box>
        </Box>
      </AppWrapper>
    </GuardWrapper>
  )
}
